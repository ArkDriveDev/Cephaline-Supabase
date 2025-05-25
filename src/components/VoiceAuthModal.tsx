import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonButton,
  IonFooter,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { mic, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { supabase } from '../utils/supaBaseClient';

interface VoiceAuthModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  onAuthSuccess: () => void;
  userId: string;
}

const VoiceAuthModal: React.FC<VoiceAuthModalProps> = ({
  isOpen,
  onDidDismiss,
  onAuthSuccess,
  userId,
}) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported'>(
    'idle'
  );
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  const isBrowserSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  useEffect(() => {
    // Check browser support when component mounts
    if (!isBrowserSupported()) {
      setStatus('unsupported');
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const handleListenStart = () => {
    if (!isBrowserSupported()) {
      setStatus('unsupported');
      return;
    }

    setStatus('listening');
    setError('');

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const newRecognition = new SpeechRecognition();
    setRecognition(newRecognition);

    newRecognition.continuous = false;
    newRecognition.interimResults = false;
    newRecognition.lang = 'en-US';

    newRecognition.onresult = async (event: any) => {
      setStatus('processing');
      try {
        const spokenText = event.results[0][0].transcript;
        
        const { data, error: supabaseError } = await supabase
          .from('user_voice_passwords')
          .select('password')
          .eq('user_id', userId)
          .single();

        if (supabaseError || !data?.password) {
          throw new Error('Voice authentication not set up');
        }

        // Simple comparison - you might want to add more sophisticated matching
        if (data.password.toLowerCase().trim() === spokenText.toLowerCase().trim()) {
          // Update last used timestamp
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
    };

    newRecognition.onerror = (event: any) => {
      setStatus('error');
      setError(event.error === 'no-speech' ? 'No speech detected' : 'Recognition error');
    };

    newRecognition.start();
  };

  const handleStopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setStatus('idle');
  };

  if (status === 'unsupported') {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Voice Authentication</IonTitle>
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
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ion-text-center">
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

        {status === 'success' && (
          <div className="ion-text-center">
            <IonIcon icon={checkmarkCircle} color="success" size="large" />
            <p>Voice verified successfully!</p>
          </div>
        )}

        {status === 'error' && (
          <div className="ion-text-center">
            <IonIcon icon={closeCircle} color="danger" size="large" />
            <p>{error || 'Verification failed'}</p>
          </div>
        )}

        <div style={{ margin: '2rem 0' }}>
          <IonButton
            expand="block"
            onClick={handleListenStart}
            disabled={status === 'listening' || status === 'processing'}
          >
            <IonIcon slot="start" icon={mic} />
            {status === 'listening' ? 'Listening...' : 'Start Voice Authentication'}
          </IonButton>

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
          expand="block"
          fill="clear"
          color="medium"
          onClick={onDidDismiss}
        >
          Use another authentication method
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default VoiceAuthModal;