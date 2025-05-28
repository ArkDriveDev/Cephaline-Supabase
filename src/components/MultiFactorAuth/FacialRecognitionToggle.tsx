import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import {
  IonToggle,
  IonLabel,
  IonCard,
  IonCardContent,
  IonIcon,
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

const FacialRecognitionToggle = () => {
  // State management
  const [enabled, setEnabled] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    models: false,
    camera: false,
    upload: false
  });
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('Align your face in the frame');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceapiRef = useRef<any>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    setLoading(prev => ({ ...prev, models: true }));
    try {
      const faceapi = await import('face-api.js');
      faceapiRef.current = faceapi;

      // Try loading from multiple CDN sources
      const CDN_SOURCES = [
        'https://justadudewhohacks.github.io/face-api.js/models',
        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/models'
      ];

      for (const cdnUrl of CDN_SOURCES) {
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(cdnUrl),
            faceapi.nets.faceLandmark68TinyNet.loadFromUri(cdnUrl),
            faceapi.nets.faceRecognitionNet.loadFromUri(cdnUrl)
          ]);
          return true;
        } catch (e) {
          console.warn(`Failed loading from ${cdnUrl}`);
        }
      }
      throw new Error('All CDN sources failed');
    } catch (err) {
      setError('Failed to load face detection models');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, models: false }));
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setLoading(prev => ({ ...prev, camera: true }));
    setDetectionStatus('Align your face in the frame');

    try {
      // Start camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
      }

      // Load models in background
      const modelsLoaded = await loadModels();
      if (modelsLoaded) {
        // Start face detection
        detectionInterval.current = setInterval(detectFace, 500);
      } else {
        setDetectionStatus('Face detection not available - camera only');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access required');
      setShowCamera(false);
      setEnabled(false);
    } finally {
      setLoading(prev => ({ ...prev, camera: false }));
    }
  };

  const detectFace = async () => {
    if (!videoRef.current || !faceapiRef.current) return;

    try {
      const detections = await faceapiRef.current.detectAllFaces(
        videoRef.current,
        new faceapiRef.current.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      if (detections.length === 0) {
        setDetectionStatus('No face detected - position your face in frame');
        return;
      }

      if (detections.length > 1) {
        setDetectionStatus('Only one face allowed in frame');
        return;
      }

      const face = detections[0];
      if (face.detection.score < 0.7) {
        setDetectionStatus('Move closer to camera');
        return;
      }

      // Check face alignment using landmarks
      const landmarks = face.landmarks;
      const jawOutline = landmarks.getJawOutline();
      const nose = landmarks.getNose();

      // Simple alignment check
      const jawWidth = jawOutline[jawOutline.length - 1].x - jawOutline[0].x;
      const nosePosition = nose[3].x; // Tip of nose
      const faceCenter = jawOutline[0].x + jawWidth / 2;

      if (Math.abs(nosePosition - faceCenter) > jawWidth * 0.2) {
        setDetectionStatus('Face not centered - look straight at camera');
        return;
      }

      // If we get here, face is properly aligned
      setDetectionStatus('Face detected - capturing...');
      await capturePhoto();
    } catch (err) {
      console.error('Detection error:', err);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || detectionInterval.current === null) return;

    clearInterval(detectionInterval.current);
    detectionInterval.current = null;

    setLoading(prev => ({ ...prev, upload: true }));

    try {
      // Create canvas and draw video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      if (!blob) throw new Error('Failed to create image blob');

      // Upload to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `faces/${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('face-recognition')
        .upload(filePath, blob);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('face-recognition')
        .getPublicUrl(filePath);

      setPhoto(publicUrl);
      setEnabled(true);
      setDetectionStatus('Registration complete!');

      // Keep the success message visible for 2 seconds before closing
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      setError('Failed to save face');
      console.error('Upload error:', err);
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setDetectionStatus('');
  };

  const handleToggle = async (e: CustomEvent) => {
    const isEnabled = e.detail.checked;
    setEnabled(isEnabled);

    if (isEnabled) {
      await startCamera();
    } else {
      stopCamera();
      setPhoto(null);
    }
  };

  // Typed inline styles
  const styles: Record<string, CSSProperties> = {
    container: {
      padding: '16px'
    },
    toggleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px'
    },
    photoContainer: {
      marginTop: '16px',
      textAlign: 'center'
    },
    photoImage: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      margin: '0 auto',
      display: 'block',
      border: '2px solid #3880ff' // Using hex color instead of CSS variable
    },
    modalContent: {
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    video: {
      width: '100%',
      maxHeight: '80vh',
      objectFit: 'cover' as const
    },
    statusMessage: {
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '20px',
      maxWidth: '80%',
      zIndex: 10
    },
    modalHeader: {
      background: '#3880ff', // Using hex color instead of CSS variable
      color: 'white'
    },
    spinner: {
      marginLeft: '8px'
    }
  };


  return (
    <div style={styles.container}>
      <div style={styles.toggleContainer}>
        <IonLabel>
          <strong>Facial Recognition</strong>
          {loading.models && <IonText color="medium"><p>Loading models...</p></IonText>}
        </IonLabel>

        {(loading.models || loading.camera || loading.upload) ? (
          <IonSpinner name="crescent" />
        ) : (
          <IonToggle
            checked={enabled}
            onIonChange={handleToggle}
            disabled={loading.models || loading.camera || loading.upload}
          />
        )}
      </div>

      {photo && (
        <IonCard style={styles.photoContainer}>
          <IonCardContent>
            <IonImg src={photo} style={styles.photoImage} />
            <IonText color="medium">
              <p>Your registered face</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      )}

      <IonModal
        isOpen={showCamera}
        onDidDismiss={() => {
          stopCamera();
          setEnabled(false);
        }}
      >
        <IonHeader style={styles.modalHeader}>
          <IonToolbar>
            <IonTitle>Face Registration</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={styles.modalContent}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
            <div style={styles.statusMessage}>
              {detectionStatus}
              {(loading.upload) && <IonSpinner name="dots" style={{ marginLeft: '8px' }} />}
            </div>
          </div>
        </IonContent>
        <IonFooter>
          <IonToolbar>
            <IonButton
              expand="block"
              onClick={() => {
                stopCamera();
                setEnabled(false);
              }}
              color="danger"
            >
              <IonIcon icon={close} slot="start" />
              Cancel Registration
            </IonButton>
          </IonToolbar>
        </IonFooter>
      </IonModal>

      <IonToast
        isOpen={!!error}
        message={error}
        duration={3000}
        onDidDismiss={() => setError('')}
        color="danger"
      />
    </div>
  );
};

export default FacialRecognitionToggle;