import React, { useState, useRef } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const checkExistingPhoto = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('No authenticated user');
        return;
      }

      const { data: enrollment, error: dbError } = await supabase
        .from('user_facial_enrollments')
        .select('storage_path')
        .eq('user_id', user.id)
        .single();

      if (dbError || !enrollment?.storage_path) {
        console.log('No existing enrollment found');
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('facial-recognition')
        .getPublicUrl(enrollment.storage_path);

      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      const imgTest = await fetch(publicUrl);
      if (!imgTest.ok) {
        throw new Error('Image not found in storage');
      }

      setPhoto(publicUrl);
      setEnabled(true);
      onToggleChange(true);
    } catch (error) {
      console.error('Photo check error:', error);
      setToastMessage('Failed to load existing face data. Please re-register.');
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
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        await uploadPhoto(blob);
      }
      
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      
      setShowCameraModal(false);
    }, 'image/jpeg', 0.9);
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
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

  const uploadPhoto = async (blob: Blob) => {
    setUploading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'Not authenticated');

      const fileName = `profile_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;
      const fileExt = fileName.split('.').pop();

      const { error: uploadError } = await supabase.storage
        .from('facial-recognition')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('user_facial_enrollments')
        .upsert({
          user_id: user.id,
          storage_path: filePath
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
      setToastMessage('Photo uploaded successfully!');
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
          await supabase
            .from('user_facial_enrollments')
            .delete()
            .eq('user_id', user.id);
          await supabase.storage
            .from('facial-recognition')
            .remove([`${user.id}/`]);
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
        <IonLabel>
          <strong>Profile Photo</strong>
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
              <IonRow className="ion-align-items-center ion-justify-content-center">
                <IonCol size="12" className="ion-text-center">
                  <IonImg
                    src={photo}
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '50%',
                      margin: '0 auto',
                      objectFit: 'cover'
                    }}
                  />
                  <IonText color="success">
                    <p>Profile photo saved</p>
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
        }}
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Take Profile Photo</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: '500px',
                borderRadius: '8px',
                margin: '0 auto',
                transform: 'scaleX(-1)'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
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