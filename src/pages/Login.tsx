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
 
  
  const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
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
  
    const h1Style = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'skyblue',
    };
  
    useEffect(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes borderBlink {
          0%, 100% {
            border-color: #2B99E2;
            box-shadow: 0 0 15px #2B99E2, 0 0 15px #2BAEE2, 0 0 15px#2B99E2;
          }
          50% {
            border-color: #2B99E2;
            box-shadow: 0 0 5px #2B99E2, 0 0 5px #2B99E2, 0 0 5px #2B99E2;
          }
        }
  
        @keyframes fadeIn {
        0% {
          opacity: 0; /* Start with the card being invisible */
        }
        100% {
            opacity: 1; /* Fade in to fully visible */
         }
        }
      `;
      document.head.appendChild(style);
    }, []);
  
    const [audio] = useState(new Audio());
  
    useEffect(() => {
      audio.loop = true;
      audio.volume = 0.5;
  
      const handleUserClick = () => {
        audio.play().catch((err) => {
          console.warn('Autoplay failed:', err);
        });
        document.removeEventListener('click', handleUserClick);
      };
  
      document.addEventListener('click', handleUserClick);
      return () => {
        document.removeEventListener('click', handleUserClick);
      };
    }, [audio]);
  
    const doLogin = async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
  
      if (error) {
        setAlertMessage(error.message);
        setShowAlert(true);
        return;
      }
  
      audio.pause();
      audio.currentTime = 0;
  
      setShowToast(true);
      setTimeout(() => {
        navigation.push('/it35-lab/app', 'forward', 'replace');
      }, 300);
    };
  
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle style={h1Style}>Login</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className='ion-padding'>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: '8%',
              height: '70%',
              width: '100%',
            }}
          >
            <IonCard
              style={{
                background: 'transparent',
                marginTop: '13%',
                width: '90vw',           
                maxWidth: '500px',    
                height: 'auto',          
                padding: '1rem',
                backdropFilter: 'blur(2px)',
                border: '2px solid #2B99E2',
                boxShadow: '0 0 15px #2B99E2, 0 0 15px #2B99E2, 0 0 15px #2B99E2',
                borderRadius: '10px',
                animation: 'borderBlink 2s infinite, fadeIn 1.5s ease-in forwards',
              }}
            >
  
              <IonCardContent>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem', // adds spacing between inputs
                    marginTop: '2rem',
                  }}
                >
  
  
                  <h1 style={h1Style}>USER LOGIN</h1>
                  <IonInput
                    label="Email"
                    labelPlacement="floating"
                    fill="outline"
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onIonChange={e => setEmail(e.detail.value!)}
                    style={{
                      boxShadow: '0 0 8px rgba(43, 174, 226, 0.8)',
                      border: '1px solid rgba(43, 174, 226, 0.8)',
                      color: 'white',
                      backdropFilter: 'blur(6px)',
                    }}
                  />
                  <IonInput
                    fill="outline"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onIonChange={e => setPassword(e.detail.value!)}
                    style={{
                      marginTop: '10px',
                      boxShadow: '0 0 8px rgba(43, 174, 226, 0.8)',
                      border: '1px solid rgba(43, 174, 226, 0.8)',
                      color: 'white',
                      backdropFilter: 'blur(3px)',
                    }}
                  >
                    <IonInputPasswordToggle slot="end" color="secondary" />
                  </IonInput>
                </div>
                <IonButton onClick={doLogin} expand="full" shape="round" color="secondary">
                  Login
                </IonButton>
  
                <IonButton routerLink="/cephaline-supabase/Registration" expand="full" fill="clear" shape="round" color="secondary">
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
        </IonContent>
      </IonPage>
    );
  };
  
  export default Login;