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
  const [captureStatus, setCaptureStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing photo on component mount
  useEffect(() => {
    checkExistingPhoto();
  }, []);

  useEffect(() => {
    return () => {
      // Clean up camera stream and interval when component unmounts
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
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
      setShowCameraModal(true);
      setCaptureStatus('Preparing camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCaptureStatus('Position your face in the frame...');
      
      // Start checking for stable image
      startStabilityCheck();
    } catch (error) {
      console.error('Camera error:', error);
      setToastMessage('Please enable camera permissions');
      setShowToast(true);
      setEnabled(false);
      setShowCameraModal(false);
    }
  };

  const startStabilityCheck = () => {
    let lastImageData: ImageData | null = null;
    let stableCount = 0;
    
    captureIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const currentImageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      if (lastImageData) {
        const diff = compareImageData(lastImageData, currentImageData);
        
        if (diff < 5) { // Very similar images (stable)
          stableCount++;
          setCaptureStatus(`Hold still... (${stableCount}/3)`);
          
          if (stableCount >= 3) {
            // Stable enough - capture photo
            if (captureIntervalRef.current) {
              clearInterval(captureIntervalRef.current);
            }
            await capturePhoto();
          }
        } else {
          stableCount = 0;
          setCaptureStatus('Hold still...');
        }
      }
      
      lastImageData = currentImageData;
    }, 500);
  };

  const compareImageData = (img1: ImageData, img2: ImageData): number => {
    // Simple image difference calculation
    let diff = 0;
    for (let i = 0; i < img1.data.length; i += 4) {
      diff += Math.abs(img1.data[i] - img2.data[i]) + 
              Math.abs(img1.data[i+1] - img2.data[i+1]) + 
              Math.abs(img1.data[i+2] - img2.data[i+2]);
    }
    return diff / (img1.width * img1.height * 3);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCaptureStatus('Capturing photo...');
    
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
      
      // Stop camera stream
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      
      setShowCameraModal(false);
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
      setEnabled(false);
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

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    setShowCameraModal(false);
    setEnabled(false);
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
                    <p>Face registered successfully</p>
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
            <IonTitle>Register Your Face</IonTitle>
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
                transform: 'scaleX(-1)' // Mirror effect
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <IonText color="light" style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3>{captureStatus}</h3>
            </IonText>
          </div>
        </IonContent>
        <IonFooter>
          <IonToolbar>
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
        duration={2000}
        position="top"
      />
    </div>
  );
};

export default FacialRecognitionToggle;