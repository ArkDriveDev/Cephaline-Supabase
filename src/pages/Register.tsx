import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonPage,
  IonTitle,
  IonModal,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonAlert,
} from '@ionic/react';
import { supabase } from '../utils/supaBaseClient';
import bcrypt from 'bcryptjs';
import background from '../images/nodes.gif';

// Reusable Alert Component
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

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const h1Style = {
    display: 'flex',
    color: 'skyblue',
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
  .glow-wrapper {
    position: relative;
    width: 95%;
    max-width: 700px;
    height: auto;
    margin: 10px auto 0 auto;
    border-radius: 10px;
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 20px;
  }

  .glow-wrapper svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
  }

  .glow-border {
    fill: none;
    stroke: url(#animated-gradient);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 600;
    stroke-dashoffset: 600;
    animation: glow-move 4s ease-in-out forwards;
    filter: drop-shadow(0 0 10px #69A5FF)
            drop-shadow(0 0 20px #2BC6E2)
            drop-shadow(0 0 30px #00bfff);
  }

  @keyframes glow-move {
    0% { stroke-dashoffset: 600; }
    100% { stroke-dashoffset: 0; }
  }
`;

    document.head.appendChild(style);
  }, []);
  const handleOpenVerificationModal = () => {
    if (!email.endsWith("@nbsc.edu.ph")) {
      setAlertMessage("Only @nbsc.edu.ph emails are allowed to register.");
      setShowAlert(true);
      return;
    }

    if (password !== confirmPassword) {
      setAlertMessage("Passwords do not match.");
      setShowAlert(true);
      return;
    }

    setShowVerificationModal(true);
  };

  const doRegister = async () => {
    setShowVerificationModal(false);

    try {

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        throw new Error("Account creation failed: " + error.message);
      }


      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);


      const { error: insertError } = await supabase.from("users").insert([
        {
          username,
          user_email: email,
          user_firstname: firstName,
          user_lastname: lastName,
          user_password: hashedPassword,
        },
      ]);

      if (insertError) {
        throw new Error("Failed to save user data: " + insertError.message);
      }

      setShowSuccessModal(true);
    } catch (err) {

      if (err instanceof Error) {
        setAlertMessage(err.message);
      } else {
        setAlertMessage("An unknown error occurred.");
      }
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonContent className='ion-padding'>

        <img
          src={background}
          alt="background"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            zIndex: -1, 
          }}
        />

        <div className="glow-wrapper">
          <IonCard
            style={{
              background: 'transparent',
              backdropFilter: 'blur(20px)',
              width: '100%',
              maxWidth: '700px',
              height: 'auto',
              borderRadius: '10px',
              zIndex: 1,
              border: '2px solid transparent',
              padding: '10px 20px',
              marginTop: '20px',
            }}
          >
            <IonCardContent>
              <h1 style={h1Style}>Create your account</h1>

              <IonInput label="Username" labelPlacement="stacked" fill="outline" type="text" placeholder="Enter a unique username" value={username} onIonChange={e => setUsername(e.detail.value!)} style={{
                marginTop: '15px', boxShadow: '0 0 8px rgba(43, 174, 226, 0.8)',
                border: '1px solid rgba(43, 174, 226, 0.8)',
                color: 'white',
                backdropFilter: 'blur(3px)',
                maxWidth: '100%',
              }} />
              <IonInput label="First Name" labelPlacement="stacked" fill="outline" type="text" placeholder="Enter your first name" value={firstName} onIonChange={e => setFirstName(e.detail.value!)} style={{
                marginTop: '15px', boxShadow: '0 0 8px rgba(43, 174, 226, 0.8)',
                border: '1px solid rgba(43, 174, 226, 0.8)',
                color: 'white',
                backdropFilter: 'blur(3px)',
                maxWidth: '100%',
              }} />
              <IonInput label="Last Name" labelPlacement="stacked" fill="outline" type="text" placeholder="Enter your last name" value={lastName} onIonChange={e => setLastName(e.detail.value!)} style={{
                marginTop: '15px', boxShadow: '0 0 8px rgba(43, 174, 226, 0.8)',
                border: '1px solid rgba(43, 174, 226, 0.8)',
                color: 'white',
                backdropFilter: 'blur(3px)',
                maxWidth: '100%',
              }} />
              <IonInput label="Email" labelPlacement="stacked" fill="outline" type="email" placeholder="youremail@nbsc.edu.ph" value={email} onIonChange={e => setEmail(e.detail.value!)} style={{
                marginTop: '15px', boxShadow: '0 0 8px rgba(43, 174, 226, 0.8)',
                border: '1px solid rgba(43, 174, 226, 0.8)',
                color: 'white',
                backdropFilter: 'blur(3px)',
                maxWidth: '100%',
              }} />
              <IonInput label="Password" labelPlacement="stacked" fill="outline" type="password" placeholder="Enter password" value={password} onIonChange={e => setPassword(e.detail.value!)} style={{
                marginTop: '15px', boxShadow: '0 0 8px rgba(43, 174, 226, 0.8)',
                border: '1px solid rgba(43, 174, 226, 0.8)',
                color: 'white',
                backdropFilter: 'blur(3px)',
                maxWidth: '100%',
              }} >
                <IonInputPasswordToggle slot="end" />
              </IonInput>
              <IonInput label="Confirm Password" labelPlacement="stacked" fill="outline" type="password" placeholder="Confirm password" value={confirmPassword} onIonChange={e => setConfirmPassword(e.detail.value!)} style={{
                marginTop: '15px', boxShadow: '0 0 8px rgba(43, 174, 226, 0.8)',
                border: '1px solid rgba(43, 174, 226, 0.8)',
                color: 'white',
                backdropFilter: 'blur(3px)',
                maxWidth: '100%',
              }} >
                <IonInputPasswordToggle slot="end" />
              </IonInput>

              <IonButton onClick={handleOpenVerificationModal} expand="full" shape='round' style={{ marginTop: '15px' }} color="secondary">
                Register
              </IonButton>
              <IonButton routerLink="/it35-lab" expand="full" fill="clear" shape='round' color="secondary">
                Already have an account? Sign in
              </IonButton>


              <IonModal isOpen={showVerificationModal} onDidDismiss={() => setShowVerificationModal(false)}>
                <IonContent className="ion-padding">
                  <IonCard className="ion-padding" style={{ marginTop: '25%' }}>
                    <IonCardHeader>
                      <IonCardTitle>User Registration Details</IonCardTitle>
                      <hr />
                      <IonCardSubtitle>Username</IonCardSubtitle>
                      <IonCardTitle>{username}</IonCardTitle>

                      <IonCardSubtitle>Email</IonCardSubtitle>
                      <IonCardTitle>{email}</IonCardTitle>

                      <IonCardSubtitle>Name</IonCardSubtitle>
                      <IonCardTitle>{firstName} {lastName}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent></IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '5px' }}>
                      <IonButton fill="clear" onClick={() => setShowVerificationModal(false)}>Cancel</IonButton>
                      <IonButton color="primary" onClick={doRegister}>Confirm</IonButton>
                    </div>
                  </IonCard>
                </IonContent>
              </IonModal>


              <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
                <IonContent className="ion-padding" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', textAlign: 'center', marginTop: '35%' }}>
                  <IonTitle style={{ marginTop: '35%' }}>Registration Successful 🎉</IonTitle>
                  <IonText>
                    <p>Your account has been created successfully.</p>
                    <p>Please check your email address.</p>
                  </IonText>
                  <IonButton routerLink="/it35-lab" routerDirection="back" color="primary">
                    Go to Login
                  </IonButton>
                </IonContent>
              </IonModal>


              <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />

            </IonCardContent>
          </IonCard>
          <svg>
            <defs>
              <linearGradient id="animated-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#69A5FF">
                  <animate attributeName="offset" values="0;1" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="0.5" stopColor="#2BC6E2">
                  <animate attributeName="offset" values="0.5;1.5" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="1" stopColor="#00bfff">
                  <animate attributeName="offset" values="1;2" dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
            <rect className="glow-border" x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" rx="10" ry="10" pathLength="600" />
          </svg>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;