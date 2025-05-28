import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import {
  IonToggle, IonLabel, IonCard, IonCardContent, IonIcon,
  IonToast, IonText, IonSpinner, IonImg, IonModal,
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton
} from '@ionic/react';
import { close, helpCircle } from 'ionicons/icons';
import { supabase } from '../../utils/supaBaseClient';

const FacialRecognitionToggle = () => {
  // State
  const [enabled, setEnabled] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    models: false, camera: false, upload: false
  });
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('Align face in circle');
  const [facePosition, setFacePosition] = useState<{x: number, y: number, size: number} | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceapiRef = useRef<any>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup
  useEffect(() => () => {
    if (detectionInterval.current) clearInterval(detectionInterval.current);
    stopCamera();
  }, []);

  const loadModels = async () => {
    setLoading(prev => ({ ...prev, models: true }));
    try {
      const faceapi = await import('face-api.js');
      faceapiRef.current = faceapi;
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
      ]);
      return true;
    } catch (err) {
      setError('Failed to load face models');
      return false;
    } finally {
      setLoading(prev => ({ ...prev, models: false }));
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setLoading(prev => ({ ...prev, camera: true }));
    setDetectionStatus('Align face in circle');
    setFacePosition(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) videoRef.current.onloadedmetadata = resolve;
        });
      }

      if (await loadModels()) {
        detectionInterval.current = setInterval(detectFace, 500);
      }
    } catch (err) {
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
        new faceapiRef.current.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.5
        })
      ).withFaceLandmarks();

      if (detections.length !== 1) {
        setDetectionStatus(detections.length > 1 ? 'Only one face allowed' : 'No face detected');
        setFacePosition(null);
        return;
      }

      const face = detections[0];
      const landmarks = face.landmarks;
      
      // Robust facial points detection
      const noseTip = landmarks.getNose()[3];
      const chin = landmarks.getJawOutline()[8];
      const leftEar = landmarks.getJawOutline()[0];
      const rightEar = landmarks.getJawOutline()[16];
      
      const faceWidth = rightEar.x - leftEar.x;
      const faceHeight = chin.y - noseTip.y;
      const noseCenterOffset = Math.abs(noseTip.x - (leftEar.x + faceWidth/2));

      setFacePosition({
        x: face.detection.box.x,
        y: face.detection.box.y,
        size: Math.max(face.detection.box.width, face.detection.box.height)
      });

      if (noseCenterOffset > faceWidth * 0.15) {
        setDetectionStatus("Center your face");
        return;
      }

      if (faceHeight / faceWidth < 0.8 || faceHeight / faceWidth > 1.5) {
        setDetectionStatus("Adjust distance");
        return;
      }

      setDetectionStatus("Perfect! Capturing...");
      await capturePhoto();

      if (debugMode) {
        const canvas = document.getElementById('debug-canvas') as HTMLCanvasElement;
        if (canvas) {
          faceapiRef.current.draw.drawFaceLandmarks(canvas, landmarks);
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    setLoading(prev => ({ ...prev, upload: true }));
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Crop to circular area (80% of video dimensions)
      const diameter = Math.min(video.videoWidth, video.videoHeight) * 0.8;
      canvas.width = diameter;
      canvas.height = diameter;

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(diameter/2, diameter/2, diameter/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw video frame centered in circle
      const offsetX = (video.videoWidth - diameter) / 2;
      const offsetY = (video.videoHeight - diameter) / 2;
      ctx.drawImage(video, offsetX, offsetY, diameter, diameter, 0, 0, diameter, diameter);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      if (!blob) throw new Error('Failed to create image');

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
      setDetectionStatus('Success!');

    } catch (err) {
      setError('Failed to save photo');
      console.error(err);
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
      border: '2px solid white',
      borderRadius: '50%',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
      pointerEvents: 'none',
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
    debugToggle: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '50%'
    },
    debugCanvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      border: '2px solid red',
      opacity: 0.7,
      pointerEvents: 'none'
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
            <IonButton 
              slot="end" 
              fill="clear" 
              onClick={() => setDebugMode(!debugMode)}
              style={styles.debugToggle}
            >
              <IonIcon icon={helpCircle} color="light" />
            </IonButton>
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
            
            {debugMode && (
              <canvas 
                id="debug-canvas" 
                width={videoRef.current?.videoWidth} 
                height={videoRef.current?.videoHeight} 
                style={styles.debugCanvas} 
              />
            )}

            <div style={styles.gridOverlay} />
            
            {facePosition && (
              <div style={{
                ...styles.faceOutline,
                borderColor: detectionStatus.includes('Perfect') ? '#4CAF50' : '#FF9800',
                left: `${facePosition.x}px`,
                top: `${facePosition.y}px`,
                width: `${facePosition.size}px`,
                height: `${facePosition.size}px`,
              }} />
            )}

            <div style={styles.statusMessage}>
              {detectionStatus}
              {loading.upload && <IonSpinner name="dots" style={{ marginLeft: '8px' }} />}
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
              Cancel
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