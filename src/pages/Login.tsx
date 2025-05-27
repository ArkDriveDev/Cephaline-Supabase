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
  IonLoading
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';
import GoogleLoginButton from '../components/GoogleLoginButton';
import TotpModal from '../components/TotpModal';
import FaceRecognitionModal from '../components/FaceRecognitionModal';
import VoiceAuthModal from '../components/VoiceAuthModal';
import RecoveryCodeLoginModal from '../components/RecoveryCodeLoginModal';
import MfaActionSheet from '../components/MfaActionSheet';

interface MFAState {
  showTotpModal: boolean;
  showFaceModal: boolean;
  showVoiceModal: boolean;
  showRecoveryModal: boolean;
  showActionSheet: boolean;
  currentUser: any;
  sessionFor2FA: any;
  currentMethod: 'totp' | 'face' | 'voice' | 'recovery' | null;
  availableMethods: {
    totp: boolean;
    face: boolean;
    voice: boolean;
    recovery: boolean;
  };
}

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
    showRecoveryModal: false,
    showActionSheet: false,
    currentUser: null,
    sessionFor2FA: null,
    currentMethod: null,
    availableMethods: {
      totp: false,
      face: false,
      voice: false,
      recovery: true
    }
  });

  const completeLogin = () => {
    setShowToast(true);
    setTimeout(() => {
      navigation.push('/app', 'forward', 'replace');
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

      setMfaState({
        ...mfaState,
        showTotpModal: false,
        showFaceModal: false,
        showVoiceModal: false,
        showRecoveryModal: false,
        showActionSheet: false,
        currentUser: data.user,
        sessionFor2FA: data,
        currentMethod: null
      });

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

      // Check all MFA methods in parallel
      const [
        { data: totpData },
        { data: faceData },
        { data: voiceData },
        { data: recoveryData }
      ] = await Promise.all([
        supabase.from('user_totp').select('user_id').eq('user_id', userId).maybeSingle(),
        supabase.from('user_facial_enrollments').select('user_id').eq('user_id', userId).maybeSingle(),
        supabase.from('user_voice_passwords').select('user_id').eq('user_id', userId).maybeSingle(),
        supabase.from('recovery_codes').select('user_id').eq('user_id', userId).eq('code_status', 'active').maybeSingle()
      ]);

      // Update available methods
      const availableMethods = {
        totp: !!totpData,
        face: !!faceData,
        voice: !!voiceData,
        recovery: !!recoveryData
      };

      setMfaState(prev => ({
        ...prev,
        availableMethods,
        currentUser: user
      }));

      // Check which method to show first (priority order: totp > face > voice > recovery)
      if (totpData) {
        setMfaState(prev => ({
          ...prev,
          showTotpModal: true,
          currentMethod: 'totp'
        }));
      } else if (faceData) {
        setMfaState(prev => ({
          ...prev,
          showFaceModal: true,
          currentMethod: 'face'
        }));
      } else if (voiceData) {
        setMfaState(prev => ({
          ...prev,
          showVoiceModal: true,
          currentMethod: 'voice'
        }));
      } else if (recoveryData) {
        setMfaState(prev => ({
          ...prev,
          showRecoveryModal: true,
          currentMethod: 'recovery'
        }));
      } else {
        completeLogin();
      }
    } catch (error) {
      console.error('Error checking MFA factors:', error);
      completeLogin(); // Fallback to regular login
    } finally {
      setIsLoading(false);
    }
  };

  // MFA Success Handlers
  const handleTotpSuccess = () => {
    setMfaState(prev => ({ ...prev, showTotpModal: false }));
    completeLogin();
  };

  const handleFaceVerificationSuccess = () => {
    setMfaState(prev => ({ ...prev, showFaceModal: false }));
    completeLogin();
  };

  const handleVoiceVerificationSuccess = () => {
    setMfaState(prev => ({ ...prev, showVoiceModal: false }));
    completeLogin();
  };

  const handleRecoveryCodeSuccess = () => {
    setMfaState(prev => ({ ...prev, showRecoveryModal: false }));
    completeLogin();
  };

  const showAlternativeMethods = () => {
    setMfaState(prev => ({
      ...prev,
      showTotpModal: false,
      showFaceModal: false,
      showVoiceModal: false,
      showRecoveryModal: false,
      showActionSheet: true
    }));
  };

  const handleSelectAlternativeMethod = (method: 'totp' | 'face' | 'voice' | 'recovery') => {
    setMfaState(prev => ({
      ...prev,
      showActionSheet: false,
      showTotpModal: method === 'totp',
      showFaceModal: method === 'face',
      showVoiceModal: method === 'voice',
      showRecoveryModal: method === 'recovery',
      currentMethod: method
    }));
  };

  const verifyRecoveryCode = async (code: string): Promise<boolean> => {
    if (!mfaState.currentUser) return false;

    try {
      const { data, error } = await supabase.rpc('verify_recovery_code', {
        user_id: mfaState.currentUser.id,
        code: code
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Recovery code verification error:', error);
      return false;
    }
  };
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
                routerLink="/Registration"
                color="primary"
                disabled={isLoading}
              >
                Don't have an account? Register here
              </IonButton>
              <IonButton
                routerLink="/forgotpassword"
                expand="full"
                fill="clear"
                style={{
                  color: '#a1a1aa',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 'normal',
                  marginTop: '0'
                }}
              >
                Forgot Password?
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
          onDidDismiss={() => setMfaState(prev => ({ ...prev, showTotpModal: false }))}
          session={mfaState.sessionFor2FA}
          onVerificationSuccess={handleTotpSuccess}
          onTryAnotherWay={showAlternativeMethods}
        />

        <FaceRecognitionModal
          isOpen={mfaState.showFaceModal}
          onDidDismiss={() => setMfaState(prev => ({ ...prev, showFaceModal: false }))}
          userId={mfaState.currentUser?.id}
          onVerificationSuccess={handleFaceVerificationSuccess}
          onTryAnotherWay={showAlternativeMethods}
        />

        <VoiceAuthModal
          isOpen={mfaState.showVoiceModal}
          onDidDismiss={() => setMfaState(prev => ({ ...prev, showVoiceModal: false }))}
          onAuthSuccess={handleVoiceVerificationSuccess}
          userId={mfaState.currentUser?.id}
          onTryAnotherWay={showAlternativeMethods}
        />

        <RecoveryCodeLoginModal
          isOpen={mfaState.showRecoveryModal}
          onClose={() => setMfaState(prev => ({ ...prev, showRecoveryModal: false }))}
          onSubmit={verifyRecoveryCode}
          onLoginSuccess={handleRecoveryCodeSuccess}
          onTryAnotherWay={showAlternativeMethods}
          userId={mfaState.currentUser?.id}
        />

        <MfaActionSheet
          isOpen={mfaState.showActionSheet}
          onDidDismiss={() => setMfaState(prev => ({ ...prev, showActionSheet: false }))}
          currentMethod={mfaState.currentMethod}
          availableMethods={mfaState.availableMethods}
          onSelectOption={handleSelectAlternativeMethod}
        />

        <IonLoading isOpen={isLoading} message="Authenticating..." />
      </IonContent>
    </IonPage>
  );
};

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

export default Login;