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
import { supabase } from '../utils/supaBaseClient';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onVerificationSuccess: () => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        verifyFace(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const verifyFace = async (imageData: string) => {
  try {
    setIsProcessing(true);
    setError(null);
    
    // 1. Get current user (new method)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    // 2. Call your face verification endpoint
    const { data, error: verifyError } = await supabase
      .rpc('verify_face', {
        user_id: user.id,
        image_data: imageData.split(',')[1] // Remove data URL prefix
      });

    if (verifyError) throw verifyError;

    // 3. Handle verification result
    if (data?.is_verified) {
      onVerificationSuccess();
    } else {
      throw new Error('Face verification failed. Please try again.');
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Verification failed');
  } finally {
    setIsProcessing(false);
  }
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
            header="Error"
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
                    <div>
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
                      <IonButton 
                        expand="block" 
                        onClick={() => setImageSrc(null)}
                        fill="outline"
                      >
                        Retake Photo
                      </IonButton>
                    </div>
                  ) : (
                    <>
                      <IonButton 
                        expand="block" 
                        color="primary" 
                        onClick={handleCaptureClick}
                      >
                        <IonIcon icon={cameraOutline} slot="start" />
                        Take Photo
                      </IonButton>
                      <p style={{ marginTop: '16px' }}>
                        Position your face in the frame
                      </p>
                    </>
                  )}
                </IonCol>
                {onFallbackToTotp && (
                  <IonCol size="12" className="ion-text-center">
                    <IonText color="medium">
                      <p 
                        style={{ cursor: 'pointer', marginTop: '1rem' }}
                        onClick={onFallbackToTotp}
                      >
                        <strong>Try another way</strong>
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