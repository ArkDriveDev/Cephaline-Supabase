import React, { useState, useRef } from 'react';
import {
  IonModal,
  IonButton,
  IonIcon,
  IonText,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonAlert
} from '@ionic/react';
import { cameraOutline, closeOutline } from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onVerificationSuccess: (confidence?: number) => void;
  onFallbackToTotp?: () => void;
}

const FaceRecognitionModal: React.FC<FaceRecognitionModalProps> = ({
  isOpen,
  onDidDismiss,
  onVerificationSuccess,
  onFallbackToTotp
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    confidence?: number;
    landmarks?: number[][];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous results
    setVerificationResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string;
        setImageSrc(imageData);
        await verifyFace(imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  const verifyFace = async (imageData: string) => {
    try {
      setIsProcessing(true);
      
      // 1. Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      // 2. Call edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-face`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            user_id: user.id,
            image_data: imageData.split(',')[1] // Remove data URL prefix
          })
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Verification failed');

      // 3. Handle results
      setVerificationResult({
        confidence: result.confidence,
        landmarks: result.landmarks
      });

      if (result.verified) {
        onVerificationSuccess(result.confidence);
      } else {
        throw new Error(`Verification failed (${Math.round(result.confidence * 100)}% confidence)`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderFaceLandmarks = () => {
    if (!verificationResult?.landmarks || !imageSrc) return null;

    return (
      <svg 
        width="100%" 
        height="100%" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
        viewBox={`0 0 ${imageSrc ? '300 300' : '0 0'}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {verificationResult.landmarks.map((point, i) => (
          <circle 
            cx={point[0]} 
            cy={point[1]} 
            r="3" 
            fill="rgba(0, 255, 0, 0.7)" 
            key={`landmark-${i}`}
          />
        ))}
      </svg>
    );
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Face Verification</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onDidDismiss}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <input
          type="file"
          accept="image/*"
          capture="user"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {error && (
          <IonAlert
            isOpen={!!error}
            onDidDismiss={() => setError(null)}
            header="Verification Failed"
            message={error}
            buttons={['OK']}
          />
        )}

        <IonCard className="ion-text-center">
          <IonCardContent>
            <IonGrid>
              <IonRow className="ion-justify-content-center ion-padding">
                <IonCol size="12">
                  {isProcessing ? (
                    <div className="ion-text-center">
                      <IonSpinner name="crescent" />
                      <IonText color="medium">
                        <p>Verifying your face...</p>
                      </IonText>
                    </div>
                  ) : imageSrc ? (
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={imageSrc} 
                        alt="Captured face" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '8px',
                          marginBottom: '16px'
                        }} 
                      />
                      {renderFaceLandmarks()}
                      <div style={{ marginTop: '16px' }}>
                        {verificationResult?.confidence && (
                          <IonText color={verificationResult.confidence > 0.8 ? 'success' : 'warning'}>
                            <p>Confidence: {Math.round(verificationResult.confidence * 100)}%</p>
                          </IonText>
                        )}
                        <IonButton 
                          expand="block" 
                          onClick={() => {
                            setImageSrc(null);
                            setVerificationResult(null);
                          }}
                          fill="outline"
                        >
                          Retake Photo
                        </IonButton>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        width: '100%',
                        height: '300px',
                        backgroundColor: '#f4f4f4',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IonText color="medium">
                          <p>Face preview will appear here</p>
                        </IonText>
                      </div>
                      <IonButton 
                        expand="block" 
                        color="primary" 
                        onClick={handleCaptureClick}
                      >
                        <IonIcon icon={cameraOutline} slot="start" />
                        Take Photo
                      </IonButton>
                      <p style={{ marginTop: '16px' }}>
                        Position your face in the frame with good lighting
                      </p>
                    </>
                  )}
                </IonCol>
                {onFallbackToTotp && (
                  <IonCol size="12" className="ion-text-center">
                    <IonText color="medium">
                      <p 
                        style={{ 
                          cursor: 'pointer', 
                          marginTop: '1rem',
                          textDecoration: 'underline'
                        }}
                        onClick={() => {
                          onDidDismiss();
                          onFallbackToTotp();
                        }}
                      >
                        <strong>Use verification code instead</strong>
                      </p>
                    </IonText>
                  </IonCol>
                )}
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default FaceRecognitionModal;