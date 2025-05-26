import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { mic, checkmarkCircle, closeCircle, close } from 'ionicons/icons';
import { supabase } from '../utils/supaBaseClient';
import { voiceAuthService } from '../services/voice-auth.service';

interface VoiceAuthModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onAuthSuccess: () => void;
  userId: string;
  onTryAnotherWay: () => void;
}

const VoiceAuthModal: React.FC<VoiceAuthModalProps> = ({
  isOpen,
  onDidDismiss,
  onAuthSuccess,
  userId,
  onTryAnotherWay,
}) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported'>('idle');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!voiceAuthService.isBrowserSupported()) {
      setStatus('unsupported');
    }
    
    return () => {
      voiceAuthService.stop();
    };
  }, []);

  const handleListenStart = () => {
    if (!voiceAuthService.isBrowserSupported()) {
      setStatus('unsupported');
      return;
    }

    setStatus('listening');
    setError('');

    voiceAuthService.startListening(
      async (spokenText) => {
        setStatus('processing');
        try {
          const { data, error: supabaseError } = await supabase
            .from('user_voice_passwords')
            .select('password')
            .eq('user_id', userId)
            .single();

          if (supabaseError || !data?.password) {
            throw new Error('Voice authentication not set up');
          }

          // Compare both in uppercase
          if (data.password.toUpperCase().trim() === spokenText.toUpperCase().trim()) {
            await supabase
              .from('user_voice_passwords')
              .update({ last_used_at: new Date().toISOString() })
              .eq('user_id', userId);

            setStatus('success');
            setTimeout(() => onAuthSuccess(), 1000);
          } else {
            throw new Error('Voice authentication failed');
          }
        } catch (err) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Verification failed');
        }
      },
      (error) => {
        setStatus('error');
        setError(error === 'no-speech' ? 'No speech detected' : 'Recognition error');
      }
    );
  };

  const handleStopListening = () => {
    voiceAuthService.stop();
    setStatus('idle');
  };

  const handleRetry = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setStatus('idle');
      setError('');
    } else {
      onDidDismiss();
    }
  };

  if (status === 'unsupported') {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Voice Authentication</IonTitle>
            <IonButton slot="end" fill="clear" onClick={onDidDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <IonIcon icon={closeCircle} color="danger" size="large" />
          <IonText>
            <h3>Browser Not Supported</h3>
            <p>Voice authentication requires Chrome or Edge with microphone access.</p>
          </IonText>
          <IonButton expand="block" onClick={onDidDismiss}>
            Close
          </IonButton>
        </IonContent>
      </IonModal>
    );
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Voice Authentication</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onDidDismiss}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center">
        {status === 'success' ? (
          <div style={{ padding: '2rem' }}>
            <IonIcon icon={checkmarkCircle} color="success" size="large" />
            <IonText>
              <h3>Verification Successful!</h3>
              <p>You will be redirected shortly...</p>
            </IonText>
          </div>
        ) : (
          <>
            {status === 'idle' && (
              <>
                <IonIcon icon={mic} size="large" color="primary" />
                <IonText>
                  <p>Click the button and say your voice passphrase</p>
                </IonText>
              </>
            )}

            {status === 'listening' && (
              <div className="ion-text-center">
                <IonSpinner name="circles" color="primary" />
                <p>Listening... Speak now</p>
              </div>
            )}

            {status === 'processing' && (
              <div className="ion-text-center">
                <IonSpinner name="dots" color="primary" />
                <p>Verifying your voice...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="ion-text-center">
                <IonIcon icon={closeCircle} color="danger" size="large" />
                <p>{error || 'Verification failed'}</p>
                {retryCount < 2 && (
                  <p>{2 - retryCount} attempts remaining</p>
                )}
              </div>
            )}

            <div style={{ margin: '2rem 0' }}>
              {status === 'error' ? (
                <IonButton expand="block" onClick={handleRetry}>
                  Try Again
                </IonButton>
              ) : (
                <IonButton
                  expand="block"
                  onClick={handleListenStart}
                  disabled={status === 'listening' || status === 'processing'}
                >
                  <IonIcon slot="start" icon={mic} />
                  {status === 'listening' ? 'Listening...' : 'Start Voice Authentication'}
                </IonButton>
              )}

              {(status === 'listening' || status === 'processing') && (
                <IonButton
                  expand="block"
                  fill="clear"
                  color="medium"
                  onClick={handleStopListening}
                >
                  Cancel
                </IonButton>
              )}
            </div>

            <IonButton
              fill="clear"
              expand="block"
              color="dark"
              onClick={onTryAnotherWay}
              disabled={status === 'listening' || status === 'processing'}
            >
              Try another way
            </IonButton>
          </>
        )}
      </IonContent>
    </IonModal>
  );
};

export default VoiceAuthModal;