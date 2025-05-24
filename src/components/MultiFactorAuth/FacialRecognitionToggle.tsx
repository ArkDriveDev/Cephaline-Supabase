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
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (initialEnabled) checkExistingPhoto();
    return () => cleanupCamera();
  }, []);

  const checkExistingPhoto = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: enrollment } = await supabase
        .from('user_facial_enrollments')
        .select('storage_path')
        .eq('user_id', user.id)
        .single();

      if (!enrollment?.storage_path) throw new Error('No enrollment found');

      const { data: signedUrlData } = await supabase.storage
        .from('facial-recognition')
        .createSignedUrl(enrollment.storage_path, 3600);

      if (!signedUrlData) throw new Error('Failed to generate signed URL');

      setPhoto(signedUrlData.signedUrl);
      setEnabled(true);
    } catch (error) {
      console.error('Photo check error:', error);
      await cleanupEnrollment();
    }
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setToastMessage('Camera access required');
      setShowToast(true);
      setEnabled(false);
      onToggleChange(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setDetectionStatus('processing');
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          // First validate with edge function
          const isValid = await validateFaceWithEdgeFunction(blob);
          
          if (isValid) {
            await uploadPhoto(blob);
            setDetectionStatus('success');
            setToastMessage('Face registered successfully!');
          } else {
            setDetectionStatus('error');
            setToastMessage('Please make sure only one face is visible');
          }
        } catch (error:any) {
          setDetectionStatus('error');
          setToastMessage(error.message);
        } finally {
          setShowToast(true);
          setTimeout(() => closeCamera(), 2000);
        }
      }
    }, 'image/jpeg', 0.9);
  };

  const validateFaceWithEdgeFunction = async (blob: Blob): Promise<boolean> => {
    const formData = new FormData();
    formData.append('image', blob, 'face.jpg');
    
    try {
      const response = await fetch('/api/face-detection', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Face validation failed');
      }
      
      const result = await response.json();
      return result.valid;
    } catch (error) {
      console.error('Edge function error:', error);
      throw new Error('Could not validate face. Please try again.');
    }
  };

  const uploadPhoto = async (blob: Blob) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `${user.id}/profile_${Date.now()}.jpg`;

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
          storage_path: filePath
        }, { onConflict: 'user_id' });

      if (dbError) throw dbError;

      const { data: { publicUrl } } = supabase.storage
        .from('facial-recognition')
        .getPublicUrl(filePath);

      setPhoto(publicUrl);
      setEnabled(true);
      onToggleChange(true);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save'}`);
      setEnabled(false);
      onToggleChange(false);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (e: CustomEvent) => {
    const isEnabled = e.detail.checked;

    if (!isEnabled) {
      await cleanupEnrollment();
      return;
    }

    if (!photo) await startCamera();
  };

  const cleanupEnrollment = async () => {
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
    } finally {
      setPhoto(null);
      setEnabled(false);
      onToggleChange(false);
    }
  };

  const cleanupCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const closeCamera = () => {
    cleanupCamera();
    setShowCameraModal(false);
    setDetectionStatus('idle');
  };

  return (
    <div className="ion-padding">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IonLabel>
          <strong>Facial Recognition</strong>
        </IonLabel>
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
              <IonRow className="ion-justify-content-center">
                <IonCol size="12" className="ion-text-center">
                  <IonImg
                    src={photo}
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      margin: '0 auto',
                      objectFit: 'cover'
                    }}
                  />
                  <IonText color="success">
                    <p>Face registered</p>
                  </IonText>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      )}

      <IonModal 
        isOpen={showCameraModal}
        onDidDismiss={closeCamera}
        style={{
          '--width': '100%',
          '--height': '100%',
          '--border-radius': '0',
          '--background': '#000'
        } as React.CSSProperties}
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Register Your Face</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            position: 'relative',
            backgroundColor: 'black'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '12px',
                objectFit: 'contain'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {detectionStatus === 'processing' && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                textAlign: 'center'
              }}>
                <IonSpinner name="crescent" color="light" />
                <div>Validating your face...</div>
              </div>
            )}
            
            {detectionStatus === 'success' && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'lightgreen',
                textAlign: 'center'
              }}>
                <div>Success! Face registered</div>
              </div>
            )}
            
            {detectionStatus === 'error' && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'red',
                textAlign: 'center'
              }}>
                <div>Validation failed. Try again.</div>
              </div>
            )}
          </div>
        </IonContent>
        <IonFooter>
          <IonToolbar>
            <IonButton 
              expand="block" 
              onClick={capturePhoto}
              color="primary"
              disabled={uploading || detectionStatus === 'processing'}
            >
              <IonIcon icon={camera} slot="start" />
              {detectionStatus === 'processing' ? 'Processing...' : 'Capture Photo'}
            </IonButton>
            <IonButton 
              expand="block" 
              color="medium" 
              onClick={closeCamera}
              disabled={detectionStatus === 'processing'}
            >
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