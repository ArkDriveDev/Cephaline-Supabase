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
import { voiceAuthService } from '../services/voice-auth.service';
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
    voiceAuthService.isBrowserSupported() ? 'idle' : 'unsupported'
  );
  const [error, setError] = useState('');

  const handleListenStart = () => {
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
            throw new Error('Voice password not set');
          }

          if (data.password.toLowerCase() === spokenText.toLowerCase()) {
            await supabase
              .from('user_voice_passwords')
              .update({ last_used_at: new Date().toISOString() })
              .eq('user_id', userId);
            
            setStatus('success');
            setTimeout(() => onAuthSuccess(), 1000);
          } else {
            throw new Error('Voice password does not match');
          }
        } catch (err) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Verification failed');
        }
      },
      (error) => {
        setStatus('error');
        setError(error);
      }
    );
  };

  const handleStopListening = () => {
    voiceAuthService.stop();
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      voiceAuthService.stop();
    };
  }, []);

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
            <p>Voice authentication is not available in your browser. Please try Chrome or Edge.</p>
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
          <IonText>
            <p>Press the button and say your voice password</p>
          </IonText>
        )}

        {status === 'listening' && (
          <div className="ion-text-center">
            <IonSpinner name="circles" />
            <p>Listening... Say your password now</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="ion-text-center">
            <IonSpinner name="dots" />
            <p>Verifying your voice...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="ion-text-center">
            <IonIcon icon={checkmarkCircle} color="success" size="large" />
            <p>Authentication successful!</p>
          </div>
        )}

        {status === 'error' && (
          <div className="ion-text-center">
            <IonIcon icon={closeCircle} color="danger" size="large" />
            <p>{error || 'Authentication failed'}</p>
          </div>
        )}

        <div className="ion-margin-vertical" style={{ minHeight: '120px' }}>
          {/* Visual feedback space */}
        </div>

        <IonButton
          expand="block"
          onClick={handleListenStart}
          disabled={status === 'listening' || status === 'processing'}
        >
          <IonIcon slot="start" icon={mic} />
          {status === 'listening' ? 'Listening...' : 'Start Authentication'}
        </IonButton>

        {(status === 'listening' || status === 'processing') && (
          <IonButton
            expand="block"
            fill="clear"
            color="danger"
            onClick={handleStopListening}
          >
            Cancel
          </IonButton>
        )}

        <IonButton
          expand="block"
          fill="clear"
          color="medium"
          onClick={onDidDismiss}
        >
          Use Another Method
        </IonButton>
      </IonContent>

      <IonFooter>
        <IonButton expand="block" color="medium" onClick={onDidDismiss}>
          Close
        </IonButton>
      </IonFooter>
    </IonModal>
  );
};

export default VoiceAuthModal;