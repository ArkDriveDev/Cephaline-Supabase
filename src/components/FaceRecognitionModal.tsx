import {
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon
} from '@ionic/react';
import { cameraReverse, close } from 'ionicons/icons';
import Webcam from 'react-webcam';
import { useState, useRef, useCallback } from 'react';
import { supabase } from '../utils/supaBaseClient';

interface VerificationResponse {
  verified: boolean;
  confidence?: number;
  error?: string;
  faceDetected?: boolean;
  landmarks?: any[];
}

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  userId: string;
  onVerificationSuccess: () => void;
  onTryAnotherWay: () => void;
}

const FaceRecognitionModal: React.FC<FaceRecognitionModalProps> = ({
  isOpen,
  onDidDismiss,
  userId,
  onVerificationSuccess,
  onTryAnotherWay,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [status, setStatus] = useState<'ready' | 'capturing' | 'verifying' | 'success' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoConstraints = {
    facingMode,
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

      const base64Data = imageSrc.split(',')[1];

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error('Authentication required');

      const response = await fetch('https://dofkgpqpyxfgxwwbiifj.supabase.co/functions/v1/verify-face', {
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

      const result: VerificationResponse = await response.json();

      if (result.error) throw new Error(result.error);

      if (result.confidence && result.confidence < 0.6) {
        throw new Error('Face not clear. Please try again with better lighting.');
      }

      if (!result.verified) {
        throw new Error('Face did not match. Please try again.');
      }

      setStatus('success');
      setTimeout(onVerificationSuccess, 1000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Verification failed');
      console.error('Face verification error:', err);
    }
  }, [userId, onVerificationSuccess]);

  const resetModal = () => {
    setStatus('ready');
    setErrorMessage('');
    setRetryCount(0);
    onDidDismiss();
  };

  const handleRetry = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setStatus('ready');
      setErrorMessage('');
    } else {
      resetModal();
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={resetModal}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Face Verification</IonTitle>
          <IonButton slot="end" fill="clear" onClick={resetModal}>
            <IonIcon icon={close} />
          </IonButton>
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
                <div style={{ margin: '1rem 0' }}>
                  <IonText color="danger">
                    <p>{errorMessage}</p>
                  </IonText>
                  {retryCount < 2 && status === 'error' && (
                    <IonText color="medium">
                      <p>{2 - retryCount} attempts remaining</p>
                    </IonText>
                  )}
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                {status === 'error' ? (
                  <IonButton onClick={handleRetry}>
                    Try Again
                  </IonButton>
                ) : (
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
                )}

                <IonButton
                  onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                  fill="outline"
                  disabled={status === 'verifying'}
                >
                  <IonIcon icon={cameraReverse} />
                </IonButton>

                <IonButton
                  fill="outline"
                  onClick={resetModal}
                  disabled={status === 'verifying'}
                >
                  Cancel
                </IonButton>
              </div>

              <IonButton
                fill="clear"
                expand="block"
                color="dark"
                onClick={onTryAnotherWay}
                disabled={status === 'verifying'}
              >
                Try another way
              </IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default FaceRecognitionModal;