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
  IonImg
} from '@ionic/react';
import { camera } from 'ionicons/icons';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check for existing photo on component mount
  useEffect(() => {
    checkExistingPhoto();
  }, []);

  const checkExistingPhoto = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .storage
        .from('facial-recognition')
        .createSignedUrl(`${user.id}/profile.jpg`, 3600);

      if (data?.signedUrl) {
        setPhoto(data.signedUrl);
        setEnabled(true);
      }
    } catch (error) {
      console.log('No existing photo found');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 500,
          height: 500,
          facingMode: 'user' // Front camera
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setToastMessage('Please enable camera permissions');
      setShowToast(true);
      setEnabled(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (blob) await uploadPhoto(blob);

      // Stop camera stream
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }, 'image/jpeg', 0.9);
  };

  const uploadPhoto = async (blob: Blob) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.storage
        .from('facial-recognition')
        .upload(`${user.id}/profile.jpg`, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (error) throw error;

      // Get the uploaded photo URL
      const { data: { publicUrl } } = supabase.storage
        .from('facial-recognition')
        .getPublicUrl(`${user.id}/profile.jpg`);

      setPhoto(publicUrl);
      setToastMessage('Face photo saved successfully!');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to upload photo');
      setShowToast(true);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (e: CustomEvent) => {
    const isEnabled = e.detail.checked;
    setEnabled(isEnabled);
    onToggleChange(isEnabled);

    if (isEnabled) {
      if (!photo) {
        await startCamera();
      }
    } else {
      setPhoto(null);
    }
  };

  return (
    <div className="ion-padding">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
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

      {enabled && !photo && (
        <IonCard>
          <IonCardContent>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                borderRadius: '8px',
                marginBottom: '16px'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <IonButton
              expand="block"
              onClick={capturePhoto}
              disabled={uploading}
            >
              <IonIcon icon={camera} slot="start" />
              Capture Photo
            </IonButton>
          </IonCardContent>
        </IonCard>
      )}

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
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
      />
    </div>
  );
};

export default FacialRecognitionToggle;