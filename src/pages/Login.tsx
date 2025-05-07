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

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      ion-content {
        --background: none;
        background: linear-gradient(135deg, #000000,rgb(35, 115, 213), #ffffff) !important;
      }

      ion-toolbar {
        --background: transparent !important;
        background: transparent !important;
      }
  
      .fancy-card {
        backdrop-filter: blur(10px);
        background:rgb(0, 0, 0);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        border-radius: 16px;
        animation: fadeSlideIn 1s ease;
        color: #fff;
      }
  
      .fancy-card:hover {
        transform: scale(1.02);
        transition: transform 0.3s ease;
      }
    
      .fancy-input {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #fff;
      }
  
      .fancy-button {
        background: linear-gradient(to right,rgb(52, 154, 177), #2193b0);
        color: white;
        font-weight: bold;
        transition: transform 0.2s;
      }
  
      .fancy-button:hover {
        transform: scale(1.03);
      }
  
      @keyframes fadeSlideIn {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const doLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAlertMessage(error.message);
      setShowAlert(true);
      return;
    }

    setShowToast(true);
    setTimeout(() => {
      navigation.push('/cephaline-supabase/app', 'forward', 'replace');
    }, 300);
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
              ></IonInput>

              <IonInput
                className="fancy-input"
                fill="outline"
                type="password"
                placeholder="Password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value!)}
                style={{ marginTop: '1rem' }}
              >
                <IonInputPasswordToggle slot="end" />
              </IonInput>

              <IonButton
                className="fancy-button"
                expand="block"
                onClick={doLogin}
                style={{ marginTop: '2rem', borderRadius: '8px' }}
              >
                Login
              </IonButton>

              <IonButton
                fill="clear"
                expand="block"
                routerLink="/cephaline-supabase/Registration"
                color="primary"
              >
                Don’t have an account? Register here
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
      </IonContent>
    </IonPage>
  );
};

export default Login;