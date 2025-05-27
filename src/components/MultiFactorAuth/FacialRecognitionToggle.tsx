import React, { useState, useRef, useEffect } from 'react';
import {
  IonToggle,
  IonLabel,
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
  IonFooter,
  IonButton 
} from '@ionic/react';
import { close } from 'ionicons/icons';
import { supabase } from '../../utils/supaBaseClient';
import Human from '@vladmandic/human';

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
  const [detectionStatus, setDetectionStatus] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<Human | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stableFaceCountRef = useRef(0);

  // Check environment and auth state on mount
  useEffect(() => {
    checkExistingPhoto();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkExistingPhoto();
      }
    });

    return () => {
      cleanupCamera();
      subscription?.unsubscribe();
    };
  }, []);

  // Check for existing facial enrollment
  const checkExistingPhoto = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEnabled(false);
        return;
      }

      const { data: enrollment } = await supabase
        .from('user_facial_enrollments')
        .select('storage_path')
        .eq('user_id', user.id)
        .single();

      if (!enrollment?.storage_path) {
        setEnabled(false);
        return;
      }

      const { data: signedUrlData } = await supabase.storage
        .from('facial-recognition')
        .createSignedUrl(enrollment.storage_path, 3600);

      if (!signedUrlData) {
        setEnabled(false);
        return;
      }
      
      setPhoto(signedUrlData.signedUrl);
      setEnabled(true);
      onToggleChange(true);
    } catch (error) {
      console.error('Photo check error:', error);
      setEnabled(false);
      onToggleChange(false);
      await cleanupEnrollment();
    }
  };

  // Initialize Human.js
  const initializeHuman = async () => {
    try {
      const human = new Human({
        backend: 'webgl',
        modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models',
        face: {
          enabled: true,
          detector: { rotation: true },
          mesh: { enabled: true },
          iris: { enabled: true },
          description: { enabled: true },
          emotion: { enabled: false },
        },
        filter: { enabled: false },
        gesture: { enabled: false },
        object: { enabled: false },
      });

      await human.load();
      await human.warmup();
      humanRef.current = human;
      return true;
    } catch (error) {
      console.error('Human initialization failed:', error);
      return false;
    }
  };

  // Start face detection loop
  const startFaceDetection = async () => {
    if (!videoRef.current || !humanRef.current) return;

    try {
      const result = await humanRef.current.detect(videoRef.current);
      processDetectionResult(result);
      
      if (showCameraModal) {
        requestAnimationFrame(startFaceDetection);
      }
    } catch (error) {
      console.error('Detection error:', error);
      if (showCameraModal) {
        setTimeout(() => startFaceDetection(), 100);
      }
    }
  };

  // Process detection results and determine if face is stable
  const processDetectionResult = (result: any) => {
    if (!result?.face || result.face.length === 0) {
      setDetectionStatus('No face detected');
      stableFaceCountRef.current = 0;
      return;
    }

    // We only want one face
    if (result.face.length > 1) {
      setDetectionStatus('Multiple faces detected - please show only your face');
      stableFaceCountRef.current = 0;
      return;
    }

    const face = result.face[0];
    
    // Check face quality
    if (face.score < 0.8) {
      setDetectionStatus('Face not clear - please move closer');
      stableFaceCountRef.current = 0;
      return;
    }

    // Check face rotation
    if (Math.abs(face.rotation?.angle?.roll || 0) > 15 || 
        Math.abs(face.rotation?.angle?.pitch || 0) > 15 || 
        Math.abs(face.rotation?.angle?.yaw || 0) > 15) {
      setDetectionStatus('Face not straight - please look directly at the camera');
      stableFaceCountRef.current = 0;
      return;
    }

    // Face is good, increment stable count
    stableFaceCountRef.current++;
    setDetectionStatus(`Aligning face... ${Math.min(5, stableFaceCountRef.current)}/5`);

    // If face has been stable for 5 frames, capture
    if (stableFaceCountRef.current >= 5) {
      capturePhoto();
    }
  };

  // Capture photo from video stream
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
    }, 'image/jpeg', 0.9); // Higher quality for enrollment
  };

  // Start camera with error handling
  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      stableFaceCountRef.current = 0;
      
      const success = await initializeHuman();
      if (!success) {
        setToastMessage('Face detection initialization failed');
        setShowToast(true);
        closeCamera();
        return;
      }

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

  // Upload photo to Supabase
  const uploadPhoto = async (blob: Blob) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `${user.id}/enrollment_${Date.now()}.jpg`;
      
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

  // Toggle handler
  const handleToggle = async (e: CustomEvent) => {
    const isEnabled = e.detail.checked;
    
    // If disabling, clean up
    if (!isEnabled) {
      await cleanupEnrollment();
      return;
    }
    
    // If enabling, check if we already have a photo
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setToastMessage('Please sign in first');
      setShowToast(true);
      setEnabled(false);
      return;
    }

    const { data: existing } = await supabase
      .from('user_facial_enrollments')
      .select()
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Already enrolled, just enable
      setEnabled(true);
      onToggleChange(true);
      await checkExistingPhoto();
    } else {
      // Need to enroll
      await startCamera();
    }
  };

  // Cleanup enrollment data
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

  // Cleanup camera resources
  const cleanupCamera = () => {
    if (humanRef.current) {
      humanRef.current = null;
    }
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    setDetectionStatus('');
  };

  const closeCamera = () => {
    cleanupCamera();
    setShowCameraModal(false);
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
        style={{width: '100%',height: '100%',background: '#000'}}
      >
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Register Your Face</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {detectionStatus && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: 0,
                right: 0,
                textAlign: 'center',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '4px'
              }}>
                {detectionStatus.includes('Aligning') && (
                  <IonSpinner name="crescent" color="light" style={{ marginRight: '8px' }} />
                )}
                <span>{detectionStatus}</span>
              </div>
            )}
          </div>
        </IonContent>
        <IonFooter>
          <IonToolbar>
            <IonButton 
              expand="block" 
              color="medium" 
              onClick={closeCamera}
              style={{ margin: '8px' }}
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