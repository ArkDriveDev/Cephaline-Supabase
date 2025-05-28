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
import { useState } from 'react';
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
      recovery: false
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

      // Store the session temporarily but don't complete login yet
      setMfaState(prev => ({
        ...prev,
        currentUser: data.user,
        sessionFor2FA: data
      }));

      // Check MFA factors - this will determine if we need MFA
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
        supabase.from('recovery_codes').select('*').eq('user_id', userId).eq('code_status', 'active')
      ]);

      // Update available methods
      const availableMethods = {
        totp: !!totpData,
        face: !!faceData,
        voice: !!voiceData,
        recovery: !!recoveryData && recoveryData.length > 0
      };

      // Check if any MFA method is available
      const mfaRequired = availableMethods.totp || availableMethods.face || 
                         availableMethods.voice || availableMethods.recovery;

      setMfaState(prev => ({
        ...prev,
        availableMethods,
        currentUser: user
      }));

      if (mfaRequired) {
        // Show the highest priority MFA method
        if (availableMethods.totp) {
          setMfaState(prev => ({
            ...prev,
            showTotpModal: true,
            currentMethod: 'totp'
          }));
        } else if (availableMethods.face) {
          setMfaState(prev => ({
            ...prev,
            showFaceModal: true,
            currentMethod: 'face'
          }));
        } else if (availableMethods.voice) {
          setMfaState(prev => ({
            ...prev,
            showVoiceModal: true,
            currentMethod: 'voice'
          }));
        } else if (availableMethods.recovery) {
          setMfaState(prev => ({
            ...prev,
            showRecoveryModal: true,
            currentMethod: 'recovery'
          }));
        }
      } else {
        // No MFA required, complete login
        completeLogin();
      }
    } catch (error) {
      console.error('Error checking MFA factors:', error);
      setAlertMessage('Error checking authentication methods');
      setShowAlert(true);
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
              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Cephaline LOGIN</h2>

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
                routerLink="/forgotpass"
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

              <IonAlert
                isOpen={showAlert}
                onDidDismiss={() => setShowAlert(false)}
                header="Notification"
                message={alertMessage}
                buttons={['OK']}
              />

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
          onLoginSuccess={handleRecoveryCodeSuccess}
          onTryAnotherWay={showAlternativeMethods}
          userId={mfaState.currentUser?.id ?? ''}
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

export default Login;