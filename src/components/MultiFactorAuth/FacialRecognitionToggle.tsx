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
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';

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
  const [detectionActive, setDetectionActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<faceDetection.FaceDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check for existing photo on mount
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
      
      setPhoto(signedUrlData.signedUrl); // Fixed: Use signedUrlData.signedUrl
      setEnabled(true);
    } catch (error) {
      console.error('Photo check error:', error);
      await cleanupEnrollment();
    }
  };

  const startFaceDetection = async () => {
    if (!videoRef.current) return;

    try {
      await tf.ready(); // Initialize TFJS first
      await tf.setBackend('webgl'); // Fixed: Properly await backend setting
      
      detectorRef.current = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
        }
      );

      setDetectionActive(true);
      detectFaces();
    } catch (error) {
      console.error('Face detection init error:', error);
      setToastMessage('Automatic detection failed. Capture manually.');
      setShowToast(true);
    }
  };

  const detectFaces = async () => {
    if (!videoRef.current || !detectorRef.current) return;

    try {
      const faces = await detectorRef.current.estimateFaces(videoRef.current);
      
      if (faces.length === 1) {
        await capturePhoto();
        return;
      }

      // Continue detection
      animationFrameRef.current = requestAnimationFrame(detectFaces);
    } catch (error) {
      console.error('Detection error:', error);
      animationFrameRef.current = requestAnimationFrame(detectFaces);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) await uploadPhoto(blob);
      closeCamera();
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
        await videoRef.current.play();
        startFaceDetection();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setToastMessage('Camera access required');
      setShowToast(true);
      setEnabled(false);
      onToggleChange(false);
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
      setToastMessage('Face registered successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save'}`);
      setEnabled(false);
      onToggleChange(false);
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const closeCamera = () => {
    cleanupCamera();
    setShowCameraModal(false);
    setDetectionActive(false);
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
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-preview"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {detectionActive && (
              <div className="detection-indicator">
                <IonSpinner name="crescent" color="light" />
                <span>Align your face</span>
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
              disabled={uploading}
            >
              <IonIcon icon={camera} slot="start" />
              {uploading ? 'Processing...' : 'Capture Manually'}
            </IonButton>
            <IonButton 
              expand="block" 
              color="medium" 
              onClick={closeCamera}
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