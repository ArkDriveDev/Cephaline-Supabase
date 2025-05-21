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
  IonLoading,
} from '@ionic/react';
import { useState } from 'react';
import { supabase } from '../utils/supaBaseClient';
import { useAuth0 } from '@auth0/auth0-react';
import GoogleLoginButton from '../components/GoogleLoginButton';
import TotpModal from '../components/TotpModal';

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
  const [session, setSession] = useState<any>(null);
  const [totpCode, setTotpCode] = useState('');

  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  const checkTotpRequirement = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('totp_codes')
        .select('*')
        .eq('user_id', userId)
        .is('used_at', null);

      if (error) {
        console.error('Error checking TOTP:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking TOTP:', error);
      return false;
    }
  };

  const verifyTotpCode = async (code: string) => {
    if (!session?.user?.id) {
      setAlertMessage('Session expired. Please login again.');
      setShowAlert(true);
      return false;
    }

    try {
      setIsLoading(true);
      
      // First check if the code exists and is valid
      const { data, error } = await supabase
        .from('totp_codes')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('code_hash', code) // In production, hash the input code first
        .is('used_at', null)
        .single();

      if (error || !data) {
        throw new Error('Invalid verification code');
      }

      // Mark the code as used
      const { error: updateError } = await supabase
        .from('totp_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', data.id);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (error: any) {
      console.error('TOTP verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpSubmit = async () => {
    try {
      const isValid = await verifyTotpCode(totpCode);
      if (isValid) {
        setShowTotpModal(false);
        setShowToast(true);
        setTimeout(() => {
          navigation.push('/Cephaline-Supabase/app', 'forward', 'replace');
        }, 300);
      }
    } catch (error: any) {
      setAlertMessage(error.message || 'Verification failed. Please try again.');
      setShowAlert(true);
    }
  };

  const doLogin = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      // Check if user has pending TOTP codes
      const requiresTotp = await checkTotpRequirement(data.user.id);
      
      if (requiresTotp) {
        setSession(data);
        setShowTotpModal(true);
      } else {
        setShowToast(true);
        setTimeout(() => {
          navigation.push('/Cephaline-Supabase/app', 'forward', 'replace');
        }, 300);
      }
    } catch (error: any) {
      setAlertMessage(error.message || 'Login failed. Please check your credentials.');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpInputChange = (e: CustomEvent) => {
    setTotpCode(e.detail.value);
  };

  const handleModalDismiss = () => {
    setShowTotpModal(false);
    supabase.auth.signOut();
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
              <IonLoading isOpen={isLoading} message="Please wait..." />
            </IonCardContent>
          </IonCard>
        </div>

        <TotpModal 
          isOpen={showTotpModal}
          onDidDismiss={handleModalDismiss}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;