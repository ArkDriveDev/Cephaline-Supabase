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
  const [detectionStatus, setDetectionStatus] = useState('Align your face with the circle');
  const [facePosition, setFacePosition] = useState<{x: number, y: number, size: number} | null>(null);

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
    setDetectionStatus('Align your face with the circle');
    setFacePosition(null);

    try {
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

      const modelsLoaded = await loadModels();
      if (modelsLoaded) {
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
        setDetectionStatus('No face detected - position inside the circle');
        setFacePosition(null);
        return;
      }

      if (detections.length > 1) {
        setDetectionStatus('Only one face allowed in frame');
        setFacePosition(null);
        return;
      }

      const face = detections[0];
      if (face.detection.score < 0.7) {
        setDetectionStatus('Move closer to camera');
        setFacePosition(null);
        return;
      }

      // Calculate face position relative to video
      const videoRect = videoRef.current.getBoundingClientRect();
      const box = face.detection.box;
      
      // Position for the green outline
      setFacePosition({
        x: box.x,
        y: box.y,
        size: Math.max(box.width, box.height)
      });

      // Check if face is centered in the grid (20% padding)
      const isCentered = (
        Math.abs(box.x - videoRect.width * 0.2) < 30 &&
        Math.abs(box.y - videoRect.height * 0.2) < 30 &&
        Math.abs(box.width - videoRect.width * 0.6) < 50 &&
        Math.abs(box.height - videoRect.height * 0.6) < 50
      );

      if (!isCentered) {
        setDetectionStatus('Center your face in the circle');
        return;
      }

      // Check face alignment using landmarks
      const landmarks = face.landmarks;
      const jawOutline = landmarks.getJawOutline();
      const nose = landmarks.getNose();
      const jawWidth = jawOutline[jawOutline.length - 1].x - jawOutline[0].x;
      const nosePosition = nose[3].x;
      const faceCenter = jawOutline[0].x + jawWidth / 2;

      if (Math.abs(nosePosition - faceCenter) > jawWidth * 0.2) {
        setDetectionStatus('Look straight at the camera');
        return;
      }

      // If we get here, face is properly aligned
      setDetectionStatus('Perfect! Capturing...');
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
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      if (!blob) throw new Error('Failed to create image blob');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `faces/${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('face-recognition')
        .upload(filePath, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('face-recognition')
        .getPublicUrl(filePath);

      setPhoto(publicUrl);
      setEnabled(true);
      setDetectionStatus('Registration complete!');

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
    setFacePosition(null);
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

  // Styles
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
      border: '2px solid #3880ff'
    },
    cameraContainer: {
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    video: {
      width: '100%',
      maxHeight: '80vh',
      objectFit: 'cover'
    },
    gridOverlay: {
      position: 'absolute',
      width: '80%',
      height: '80%',
      border: '2px dashed rgba(255, 255, 255, 0.5)',
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      pointerEvents: 'none',
    },
    gridLine: {
      width: '100%',
      height: '1px',
      background: 'rgba(255, 255, 255, 0.3)',
    },
    faceOutline: {
      position: 'absolute',
      border: '3px solid',
      borderRadius: '50%',
      transition: 'all 0.3s ease',
      pointerEvents: 'none',
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
      background: '#3880ff',
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
          <div style={styles.cameraContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
            
            {/* Grid Overlay */}
            <div style={styles.gridOverlay}>
              <div style={styles.gridLine}></div>
              <div style={{ ...styles.gridLine, alignSelf: 'center', width: '1px', height: '80%' }}></div>
              <div style={styles.gridLine}></div>
            </div>
            
            {/* Dynamic Face Outline */}
            {facePosition && (
              <div style={{
                ...styles.faceOutline,
                borderColor: detectionStatus === 'Perfect! Capturing...' ? '#4CAF50' : '#FF9800',
                left: `${facePosition.x}px`,
                top: `${facePosition.y}px`,
                width: `${facePosition.size}px`,
                height: `${facePosition.size}px`,
              }}></div>
            )}
            
            {/* Status Message */}
            <div style={styles.statusMessage}>
              {detectionStatus}
              {loading.upload && <IonSpinner name="dots" style={styles.spinner} />}
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