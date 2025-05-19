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
import * as faceapi from 'face-api.js';

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
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load face detection models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load face detection models:', error);
        setToastMessage('Face detection features unavailable');
        setShowToast(true);
      }
    };

    loadModels();
    checkExistingPhoto();

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: enrollment, error: dbError } = await supabase
        .from('user_facial_enrollments')
        .select('storage_path')
        .eq('user_id', user.id)
        .single();

      if (dbError || !enrollment) return;

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('facial-recognition')
        .createSignedUrl(enrollment.storage_path, 3600);

      if (urlError || !signedUrlData) {
        throw urlError || new Error('Failed to generate signed URL');
      }

      setPhoto(signedUrlData.signedUrl);
      setEnabled(true);
      onToggleChange(true);
    } catch (error) {
      console.error('Photo check error:', error);
      setToastMessage('Failed to load existing face data');
      setShowToast(true);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCaptureStatus('Processing photo...');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        const success = await uploadPhoto(blob);
        if (!success) {
          setEnabled(false);
          onToggleChange(false);
        }
      }
      
      // Stop camera stream
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      
      setShowCameraModal(false);
    }, 'image/jpeg', 0.9);
  };

  const compareImageData = (img1: ImageData, img2: ImageData): number => {
    let diff = 0;
    for (let i = 0; i < img1.data.length; i += 4) {
      diff += Math.abs(img1.data[i] - img2.data[i]) + 
              Math.abs(img1.data[i+1] - img2.data[i+1]) + 
              Math.abs(img1.data[i+2] - img2.data[i+2]);
    }
    return diff / (img1.width * img1.height * 3);
  };

  const detectSmile = async (canvas: HTMLCanvasElement): Promise<boolean> => {
    if (!modelsLoaded) return false;
    
    try {
      const detections = await faceapi.detectAllFaces(
        canvas, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceExpressions();
      
      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const smileProbability = expressions.happy;
        return smileProbability > 0.85; // Adjust threshold as needed
      }
      return false;
    } catch (error) {
      console.error('Smile detection error:', error);
      return false;
    }
  };

  const startStabilityCheck = () => {
    let lastImageData: ImageData | null = null;
    let stableCount = 0;
    let smileDetected = false;
    
    captureIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // First try smile detection
      if (modelsLoaded && !smileDetected) {
        const isSmiling = await detectSmile(canvas);
        if (isSmiling) {
          smileDetected = true;
          setCaptureStatus('Smile detected! Capturing...');
          if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
          }
          await capturePhoto();
          return;
        }
      }
      
      // Fallback to stability check if smile detection fails
      const currentImageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      if (lastImageData) {
        const diff = compareImageData(lastImageData, currentImageData);
        
        if (diff < 5) { // Very similar images (stable)
          stableCount++;
          setCaptureStatus(`Hold still... (${stableCount}/3)`);
          
          if (stableCount >= 3) {
            if (captureIntervalRef.current) {
              clearInterval(captureIntervalRef.current);
            }
            await capturePhoto();
          }
        } else {
          stableCount = 0;
          setCaptureStatus(modelsLoaded ? 'Smile for the camera!' : 'Hold still...');
        }
      }
      
      lastImageData = currentImageData;
    }, 500);
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      setCaptureStatus('Initializing camera...');
      
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
      
      setCaptureStatus(modelsLoaded ? 'Smile for the camera!' : 'Position your face in the frame...');
      startStabilityCheck();
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

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('facial-recognition')
        .createSignedUrl(filePath, 3600);

      if (urlError || !signedUrlData) {
        throw urlError || new Error('Failed to generate signed URL');
      }

      setPhoto(signedUrlData.signedUrl);
      setEnabled(true);
      onToggleChange(true);
      setToastMessage('Face registration successful!');
      setShowToast(true);
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowToast(true);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (e: CustomEvent) => {
    const isEnabled = e.detail.checked;
    
    if (enabled && !isEnabled) {
      // Disabling facial recognition
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
      setEnabled(true); // Optimistically enable
      onToggleChange(true);
      await startCamera();
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
    
    // If we don't have a photo yet, reset the toggle
    if (!photo) {
      setEnabled(false);
      onToggleChange(false);
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
            disabled={uploading || disabled || !modelsLoaded}
          />
        )}
      </div>

      {!modelsLoaded && (
        <IonText color="warning">
          <p>Loading face detection features...</p>
        </IonText>
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
                transform: 'scaleX(-1)'
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
        duration={3000}
        position="top"
      />
    </div>
  );
};

export default FacialRecognitionToggle;