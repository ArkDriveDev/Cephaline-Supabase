// components/FaceRecognitionModal.tsx
import { IonModal, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner, IonText } from '@ionic/react';
import Webcam from 'react-webcam';
import { useState, useRef, useCallback } from 'react';
import { supabase } from '../utils/supaBaseClient';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  userId: string;
  onVerificationSuccess: () => void;
}

const FaceRecognitionModal: React.FC<FaceRecognitionModalProps> = ({ 
  isOpen, 
  onDidDismiss,
  userId,
  onVerificationSuccess 
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState<'ready' | 'capturing' | 'verifying' | 'success' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState('');

  const videoConstraints = {
    facingMode: 'user',
    width: 1280,
    height: 720
  };

  const capture = useCallback(async () => {
    try {
      setStatus('capturing');
      setErrorMessage('');
      
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) throw new Error('Failed to capture image');

      setStatus('verifying');
      
      // Convert to base64 (remove data URL prefix)
      const base64Data = imageSrc.split(',')[1];

      // Call verification endpoint
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) throw new Error('Authentication required');

      const response = await fetch('https://your-vercel-or-edge-function.url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          user_id: userId,
          image_data: base64Data
        })
      });

      const result = await response.json();
      
      if (result.error) throw new Error(result.error);
      if (!result.verified) throw new Error('Face did not match. Please try again.');

      setStatus('success');
      setTimeout(onVerificationSuccess, 1000); // Give user feedback before closing
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Verification failed');
      console.error('Face verification error:', err);
    }
  }, [userId, onVerificationSuccess]);

  const resetModal = () => {
    setStatus('ready');
    setErrorMessage('');
    onDidDismiss();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={resetModal}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Face Verification</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          {status === 'success' ? (
            <div style={{ padding: '2rem' }}>
              <IonText color="success">
                <h2>Verification Successful!</h2>
              </IonText>
              <p>You will be redirected shortly...</p>
            </div>
          ) : (
            <>
              <div style={{ 
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1rem',
                backgroundColor: '#f5f5f5'
              }}>
                {status !== 'ready' && status !== 'capturing' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    backgroundColor: '#000'
                  }}>
                    <IonSpinner name="dots" color="light" />
                  </div>
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>

              {errorMessage && (
                <IonText color="danger" style={{ margin: '1rem 0' }}>
                  <p>{errorMessage}</p>
                </IonText>
              )}

              <div style={{ 
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <IonButton 
                  onClick={capture}
                  disabled={status !== 'ready'}
                >
                  {status === 'verifying' ? (
                    <IonSpinner name="dots" />
                  ) : (
                    'Verify Face'
                  )}
                </IonButton>
                
                <IonButton 
                  fill="outline" 
                  onClick={resetModal}
                  disabled={status === 'verifying'}
                >
                  Cancel
                </IonButton>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default FaceRecognitionModal;