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
import { useState } from 'react';
import { supabase } from '../utils/supaBaseClient';
import GoogleLoginButton from '../components/GoogleLoginButton';
import TotpModal from '../components/TotpModal';
import FaceRecognitionModal from '../components/FaceRecognitionModal';
import VoiceAuthModal from '../components/VoiceAuthModal'; // Add this import

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
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false); // Add this state
  const [sessionFor2FA, setSessionFor2FA] = useState<any>(null);
  const [userForFaceVerification, setUserForFaceVerification] = useState<any>(null);
  const [userForVoiceVerification, setUserForVoiceVerification] = useState<any>(null); // Add this state

  const completeLogin = () => {
    setShowToast(true);
    setTimeout(() => {
      navigation.push('/Cephaline-Supabase/app', 'forward', 'replace');
    }, 300);
  };

  const doLogin = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;

      // First check for TOTP enrollment
      const { data: totpData, error: totpError } = await supabase
        .from('user_totp')
        .select('id')
        .eq('user_id', data.user?.id)
        .maybeSingle();

      if (totpError) throw totpError;

      if (totpData) {
        // TOTP is enabled - require verification
        setSessionFor2FA(data);
        setShowTotpModal(true);
        return;
      }

      // If no TOTP, check for facial recognition enrollment
      const { data: faceData, error: faceError } = await supabase
        .from('user_facial_enrollments')
        .select('id')
        .eq('user_id', data.user?.id)
        .maybeSingle();

      if (faceError) throw faceError;

      if (faceData) {
        // Facial recognition is enabled - require verification
        setUserForFaceVerification(data.user);
        setShowFaceModal(true);
        return;
      }

      // If no TOTP or Face, check for voice authentication enrollment
      const { data: voiceData, error: voiceError } = await supabase
        .from('user_voice_passwords')
        .select('id')
        .eq('user_id', data.user?.id)
        .maybeSingle();

      if (voiceError) throw voiceError;

      if (voiceData) {
        // Voice authentication is enabled - require verification
        setUserForVoiceVerification(data.user);
        setShowVoiceModal(true);
        return;
      }

      // No additional auth required - proceed with login
      completeLogin();
    } catch (error: any) {
      setAlertMessage(error.message || 'Login failed');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpSuccess = () => {
    setShowTotpModal(false);
    completeLogin();
  };

  const handleFaceVerificationSuccess = () => {
    setShowFaceModal(false);
    completeLogin();
  };

  const handleVoiceVerificationSuccess = () => {
    setShowVoiceModal(false);
    completeLogin();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ textAlign: 'left' }}>Cephaline Coding Journal App</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
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
              ></IonInput>

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

        {/* TOTP Verification Modal */}
        <TotpModal
          isOpen={showTotpModal}
          onDidDismiss={() => setShowTotpModal(false)}
          session={sessionFor2FA}
          onVerificationSuccess={handleTotpSuccess}
        />

        {/* Facial Recognition Modal */}
        <FaceRecognitionModal
          isOpen={showFaceModal}
          onDidDismiss={() => setShowFaceModal(false)}
          userId={userForFaceVerification?.id}
          onVerificationSuccess={handleFaceVerificationSuccess}
        />

        {/* Voice Authentication Modal */}
        <VoiceAuthModal
          isOpen={showVoiceModal}
          onDidDismiss={() => setShowVoiceModal(false)}
          onAuthSuccess={handleVoiceVerificationSuccess}
          userId={userForVoiceVerification?.id}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;