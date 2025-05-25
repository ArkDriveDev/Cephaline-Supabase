import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
  IonInput,
  IonInputPasswordToggle,
  IonAlert,
  IonToast,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';
import GoogleLoginButton from '../components/GoogleLoginButton';
import TotpModal from '../components/TotpModal';
import FaceRecognitionModal from '../components/FaceRecognitionModal';
import VoiceAuthModal from '../components/VoiceAuthModal';

interface MFAState {
  showTotpModal: boolean;
  showFaceModal: boolean;
  showVoiceModal: boolean;
  currentUser: any;
  sessionFor2FA: any;
}

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({
  message,
  isOpen,
  onClose,
}) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onClose}
      header="Notification"
      message={message}
      buttons={['OK']}
    />
  );
};

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [mfaState, setMfaState] = useState<MFAState>({
    showTotpModal: false,
    showFaceModal: false,
    showVoiceModal: false,
    currentUser: null,
    sessionFor2FA: null,
  });

  const completeLogin = () => {
    setShowToast(true);
    setTimeout(() => {
      navigation.push('/Cephaline-Supabase/app', 'forward', 'replace');
    }, 300);
  };

  const doLogin = async () => {
    if (!email || !password) {
      setAlertMessage('Please enter both email and password');
      setShowAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;

      await checkAuthFactors(data.user);
    } catch (error: any) {
      setAlertMessage(error.message || 'Login failed');
      setShowAlert(true);
      setIsLoading(false);
    }
  };

  const checkAuthFactors = async (user: any) => {
    try {
      const userId = user.id;
      
      // Check TOTP first (most secure)
      const { data: totpData } = await supabase
        .from('user_totp')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (totpData?.id) {
        setMfaState({
          ...mfaState,
          showTotpModal: true,
          currentUser: user,
          sessionFor2FA: { user }
        });
        return;
      }

      // Check Face Recognition
      const { data: faceData } = await supabase
        .from('user_facial_enrollments')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (faceData?.id) {
        setMfaState({
          ...mfaState,
          showFaceModal: true,
          currentUser: user
        });
        return;
      }

      // Check Voice Authentication
      const { data: voiceData } = await supabase
        .from('user_voice_passwords')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (voiceData?.user_id) {
        setMfaState({
          ...mfaState,
          showVoiceModal: true,
          currentUser: user
        });
        return;
      }

      // If no MFA methods found
      completeLogin();
    } catch (error) {
      console.error('Error checking MFA factors:', error);
      completeLogin(); // Fallback to regular login
    } finally {
      setIsLoading(false);
    }
  };

  // MFA Success Handlers
  const handleTotpSuccess = () => {
    setMfaState({ ...mfaState, showTotpModal: false });
    completeLogin();
  };

  const handleFaceVerificationSuccess = () => {
    setMfaState({ ...mfaState, showFaceModal: false });
    completeLogin();
  };

  const handleVoiceVerificationSuccess = () => {
    setMfaState({ ...mfaState, showVoiceModal: false });
    completeLogin();
  };

  // Try another MFA method
  const tryAnotherMethod = (currentMethod: string) => {
    switch (currentMethod) {
      case 'totp':
        setMfaState({
          ...mfaState,
          showTotpModal: false,
          showFaceModal: true
        });
        break;
      case 'face':
        setMfaState({
          ...mfaState,
          showFaceModal: false,
          showVoiceModal: true
        });
        break;
      case 'voice':
        setMfaState({
          ...mfaState,
          showVoiceModal: false,
          showTotpModal: true
        });
        break;
      default:
        setMfaState({
          showTotpModal: false,
          showFaceModal: false,
          showVoiceModal: false,
          currentUser: null,
          sessionFor2FA: null
        });
        completeLogin();
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      setMfaState({
        showTotpModal: false,
        showFaceModal: false,
        showVoiceModal: false,
        currentUser: null,
        sessionFor2FA: null
      });
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ textAlign: 'left' }}>Cephaline Coding Journal App</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}>
          <IonCard className="fancy-card" style={{ width: '90%', maxWidth: '400px', padding: '2rem' }}>
            <IonCardContent>
              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>USER LOGIN</h2>

              <IonInput
                fill="outline"
                className="fancy-input"
                type="email"
                placeholder="Email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
                disabled={isLoading}
              />

              <IonInput
                className="fancy-input"
                fill="outline"
                type="password"
                placeholder="Password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value!)}
                style={{ marginTop: '1rem' }}
                disabled={isLoading}
              >
                <IonInputPasswordToggle slot="end" />
              </IonInput>

              <IonButton
                className="fancy-button"
                expand="block"
                onClick={doLogin}
                style={{ marginTop: '2rem', borderRadius: '8px' }}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </IonButton>

              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <span style={{ color: '#666' }}>OR</span>
              </div>

              <GoogleLoginButton />

              <IonButton
                fill="clear"
                expand="block"
                routerLink="/Cephaline-Supabase/Registration"
                color="primary"
                disabled={isLoading}
              >
                Don't have an account? Register here
              </IonButton>

              <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />
              <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message="Login successful! Redirecting..."
                duration={1500}
                position="top"
                color="primary"
              />
            </IonCardContent>
          </IonCard>
        </div>

        {/* MFA Modals */}
        <TotpModal
          isOpen={mfaState.showTotpModal}
          onDidDismiss={() => setMfaState({ ...mfaState, showTotpModal: false })}
          session={mfaState.sessionFor2FA}
          onVerificationSuccess={handleTotpSuccess}
          onTryAnotherWay={() => tryAnotherMethod('totp')}
        />

        <FaceRecognitionModal
          isOpen={mfaState.showFaceModal}
          onDidDismiss={() => setMfaState({ ...mfaState, showFaceModal: false })}
          userId={mfaState.currentUser?.id}
          onVerificationSuccess={handleFaceVerificationSuccess}
          onTryAnotherWay={() => tryAnotherMethod('face')}
        />

        <VoiceAuthModal
          isOpen={mfaState.showVoiceModal}
          onDidDismiss={() => setMfaState({ ...mfaState, showVoiceModal: false })}
          onAuthSuccess={handleVoiceVerificationSuccess}
          userId={mfaState.currentUser?.id}
          onTryAnotherWay={() => tryAnotherMethod('voice')}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;