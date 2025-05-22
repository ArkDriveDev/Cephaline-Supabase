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
import { useState, useEffect, useRef } from 'react';
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
  const authChecked = useRef(false);

  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  const checkTotpRequirement = async (userId: string) => {
    try {
      const { data: secretData, error: secretError } = await supabase
        .from('user_totp') 
        .select('secret') 
        .eq('user_id', userId)
        .single();

      if (secretError && secretError.code !== 'PGRST116') throw secretError;
      return !!secretData?.secret;
    } catch (error) {
      console.error('Error checking TOTP status:', error);
      return false;
    }
  };

  const checkFaceEnrollment = async (userId: string) => {
  try {
    const { data: faceData, error: faceError } = await supabase
      .from('user_facial_enrollments')
      .select('user_id, face_descriptor')
      .eq('user_id', userId)
      .single();

    if (faceError && faceError.code !== 'PGRST116') throw faceError;
    return !!faceData?.face_descriptor;
  } catch (error) {
    console.error('Error checking face enrollment:', error);
    return false;
  }
};

  const doLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Attempting login with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('Login successful, user ID:', data.user?.id);
      const requiresTotp = await checkTotpRequirement(data.user?.id);
      console.log('TOTP required:', requiresTotp);

      if (requiresTotp) {
        setShowTotpModal(true);
        setSession(data);
        setIsLoading(false);
        return;
      }

      // Direct login without TOTP
      setShowToast(true);
      setTimeout(() => navigation.push('/Cephaline-Supabase/app', 'forward', 'replace'), 1000);
    } catch (error: any) {
      console.error('Login error:', error);
      setAlertMessage(
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password'
          : error.message || 'Login failed'
      );
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpSuccess = async () => {
    setShowTotpModal(false);
    
    try {
      setIsLoading(true);
      console.log('Refreshing session after TOTP verification');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setShowToast(true);
      navigation.push('/Cephaline-Supabase/app', 'forward', 'replace');
    } catch (error) {
      console.error('Error refreshing session:', error);
      setAlertMessage('Failed to establish session after verification');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing session on component mount
  useEffect(() => {
    if (authChecked.current) return;
    
    const checkSession = async () => {
      authChecked.current = true;
      setIsLoading(true);
      
      try {
        console.log('Checking for existing session');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
          console.log('Found existing session for user:', session.user.email);
          const requiresTotp = await checkTotpRequirement(session.user.id);
          if (!requiresTotp) {
            navigation.push('/Cephaline-Supabase/app', 'forward', 'replace');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      checkSession();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

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
          onDidDismiss={() => {
            setShowTotpModal(false);
            supabase.auth.signOut();
          }}
          session={session}
          onVerificationSuccess={handleTotpSuccess}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;