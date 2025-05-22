import React, { useState, useRef, useEffect } from 'react';
import {
  IonToggle,
  IonLabel,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonText,
  IonSpinner,
  IonImg,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter
} from '@ionic/react';
import { camera, close } from 'ionicons/icons';
import { supabase } from '../../utils/supaBaseClient';
import { loadModels, detectFace, calculateFaceSimilarity } from '../../utils/faceRecognition';

interface Props {
  initialEnabled?: boolean;
  onToggleChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const FacialRecognitionToggle: React.FC<Props> = ({
  initialEnabled = false,
  onToggleChange,
  disabled
}) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load face models:', error);
        setToastMessage('Failed to initialize face recognition');
        setShowToast(true);
      }
    };

    loadFaceModels();

    if (initialEnabled) {
      checkExistingPhoto();
    }
  }, []);

  const checkExistingPhoto = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: enrollment, error: dbError } = await supabase
        .from('user_facial_enrollments')
        .select('storage_path, face_descriptor')
        .eq('user_id', user.id)
        .single();

      if (dbError || !enrollment?.storage_path || !enrollment.face_descriptor) return;

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('facial-recognition')
        .createSignedUrl(enrollment.storage_path, 3600);

      if (urlError || !signedUrlData) throw new Error('Failed to generate signed URL');

      const signedUrl = signedUrlData.signedUrl;

      const imgTest = await fetch(signedUrl);
      if (!imgTest.ok) throw new Error('Image not found in storage');

      const img = new Image();
      img.src = signedUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (modelsLoaded) {
        const { descriptor } = await detectFace(img);
        const storedDescriptor = new Float32Array(enrollment.face_descriptor);
        const distance = calculateFaceSimilarity(descriptor, storedDescriptor);

        if (distance > 0.5) throw new Error('Face verification failed');
      }

      setPhoto(signedUrl);
      setEnabled(true);
      onToggleChange(true);
    } catch (error) {
      console.error('Photo check error:', error);
      setToastMessage('Face verification failed. Please re-register.');
      setShowToast(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_facial_enrollments')
            .delete()
            .eq('user_id', user.id);
        }
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const { descriptor } = await detectFace(canvas);

      canvas.toBlob(async (blob) => {
        if (blob) {
          await uploadPhoto(blob, descriptor);
        }

        if (video.srcObject) {
          (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }

        setShowCameraModal(false);
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Face detection error:', error);
      setToastMessage(error instanceof Error ? error.message : 'Face detection failed');
      setShowToast(true);
    }
  };

  const uploadPhoto = async (blob: Blob, descriptor: Float32Array) => {
    setUploading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'Not authenticated');

      const fileName = `profile_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('facial-recognition')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('user_facial_enrollments')
        .upsert({
          user_id: user.id,
          storage_path: filePath,
          face_descriptor: Array.from(descriptor)
        }, {
          onConflict: 'user_id'
        });

      if (dbError) throw dbError;

      const { data: { publicUrl } } = supabase.storage
        .from('facial-recognition')
        .getPublicUrl(filePath);

      setPhoto(publicUrl);
      setEnabled(true);
      onToggleChange(true);
      setToastMessage('Face registered successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowToast(true);
      setEnabled(false);
      onToggleChange(false);
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (e: CustomEvent) => {
    const isEnabled = e.detail.checked;

    if (enabled && !isEnabled) {
      setEnabled(false);
      setPhoto(null);
      onToggleChange(false);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: enrollment } = await supabase
            .from('user_facial_enrollments')
            .select('storage_path')
            .eq('user_id', user.id)
            .single();

          await supabase
            .from('user_facial_enrollments')
            .delete()
            .eq('user_id', user.id);

          if (enrollment?.storage_path) {
            await supabase.storage
              .from('facial-recognition')
              .remove([enrollment.storage_path]);
          }
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }

      return;
    }

    if (isEnabled && !photo) {
      await startCamera();
    }
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setToastMessage('Please enable camera permissions');
      setShowToast(true);
      setEnabled(false);
      onToggleChange(false);
      setShowCameraModal(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCameraModal(false);

    if (!photo) {
      setEnabled(false);
      onToggleChange(false);
    }
  };

  return (
    <div className="ion-padding">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <IonLabel><strong>Profile Photo</strong></IonLabel>
        {uploading ? (
          <IonSpinner name="crescent" />
        ) : (
          <IonToggle
            checked={enabled}
            onIonChange={handleToggle}
            disabled={uploading || disabled}
          />
        )}
      </div>

      {photo && (
        <IonCard>
          <IonCardContent>
            <IonGrid>
              <IonRow className="ion-align-items-center ion-justify-content-center">
                <IonCol size="12" className="ion-text-center">
                  <IonImg
                    src={photo}
                    style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={() => {
                      setToastMessage('Photo failed to load. Please refresh.');
                      setShowToast(true);
                      setPhoto(null);
                      setEnabled(false);
                      onToggleChange(false);
                    }}
                  />
                  <IonText color="success"><p>Facial credential saved</p></IonText>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      )}

      <IonModal isOpen={showCameraModal} onDidDismiss={closeCamera}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Take Profile Photo</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', maxWidth: '500px', transform: 'scaleX(-1)' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </IonContent>
        <IonFooter>
          <IonToolbar>
            <IonButton expand="block" onClick={capturePhoto} color="primary">
              <IonIcon icon={camera} slot="start" />
              Take Photo
            </IonButton>
            <IonButton expand="block" color="danger" onClick={closeCamera}>
              <IonIcon icon={close} slot="start" />
              Cancel
            </IonButton>
          </IonToolbar>
        </IonFooter>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
    </div>
  );
};

export default FacialRecognitionToggle;
