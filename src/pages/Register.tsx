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
  IonProgressBar
} from '@ionic/react';
import { supabase } from '../utils/supaBaseClient';
import bcrypt from 'bcryptjs';

// Reusable Alert Component
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
  const [passwordStrength, setPasswordStrength] = useState({
    value: 0,
    label: '',
    color: ''
  });

  useEffect(() => {
    if (password) {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({
        value: 0,
        label: '',
        color: ''
      });
    }
  }, [password]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength <= 2) return { value: 0.25, label: 'Very Weak', color: 'danger' };
    if (strength <= 4) return { value: 0.5, label: 'Weak', color: 'warning' };
    if (strength <= 6) return { value: 0.75, label: 'Strong', color: 'success' };
    return { value: 1, label: 'Very Strong', color: 'primary' };
  };

  const handleOpenVerificationModal = () => {
    if (password !== confirmPassword) {
      setAlertMessage('Passwords do not match.');
      setShowAlert(true);
      return;
    }

    if (password.length < 8) {
      setAlertMessage('Password must be at least 8 characters.');
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
        throw new Error('Account creation failed: ' + error.message);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { error: insertError } = await supabase.from('users').insert([
        {
          username,
          user_email: email,
          user_firstname: firstName,
          user_lastname: lastName,
          user_password: hashedPassword,
        },
      ]);

      if (insertError) {
        throw new Error('Failed to save user data: ' + insertError.message);
      }

      setShowSuccessModal(true);
    } catch (err) {
      if (err instanceof Error) {
        setAlertMessage(err.message);
      } else {
        setAlertMessage('An unknown error occurred.');
      }
      setShowAlert(true);
    }
  };

  const inputStyle = {
    marginTop: '15px',
    color: 'white',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    padding: '12px',
    '--background': '#1e1e1e',
    '--color': '#fff',
    '--placeholder-color': '#aaa',
    '--highlight-color-focused': '#3a8ef6',
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="ion-padding"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#121212',
          height: '100vh',
        }}
      >
        <IonCard
          style={{
            background: '#1e1e1e',
            width: '100%',
            maxWidth: '500px',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
            margin: 'auto',
          }}
        >
          <IonCardContent>
            <h1 style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>Create your account</h1>

            <IonInput
              label="Username"
              labelPlacement="stacked"
              fill="outline"
              type="text"
              placeholder="Enter a unique username"
              value={username}
              onIonChange={(e) => setUsername(e.detail.value!)}
              style={inputStyle}
            />
            <IonInput
              label="First Name"
              labelPlacement="stacked"
              fill="outline"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onIonChange={(e) => setFirstName(e.detail.value!)}
              style={inputStyle}
            />
            <IonInput
              label="Last Name"
              labelPlacement="stacked"
              fill="outline"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onIonChange={(e) => setLastName(e.detail.value!)}
              style={inputStyle}
            />
            <IonInput
              label="Email"
              labelPlacement="stacked"
              fill="outline"
              type="email"
              placeholder="youremail@nbsc.edu.ph"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
              style={inputStyle}
            />
            <IonInput
              label="Password"
              labelPlacement="stacked"
              fill="outline"
              type="password"
              placeholder="Enter password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
              style={inputStyle}
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            {password && (
              <div style={{ width: '100%', marginTop: '8px' }}>
                <IonProgressBar 
                  value={passwordStrength.value} 
                  color={passwordStrength.color}
                  style={{ height: '4px' }}
                />
                <IonText color={passwordStrength.color} style={{ fontSize: '12px' }}>
                  {passwordStrength.label}
                </IonText>
              </div>
            )}


            <IonInput
              label="Confirm Password"
              labelPlacement="stacked"
              fill="outline"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onIonChange={(e) => setConfirmPassword(e.detail.value!)}
              style={inputStyle}
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>
            
            <div style={{ 
              width: '100%', 
              color: '#a1a1aa',
              fontSize: '12px',
              margin: '8px 0'
            }}>
              <p>Password should contain:</p>
              <ul style={{ paddingLeft: '20px', margin: '8px 0 0 0' }}>
                <li style={{ color: password.length >= 8 ? '#3880ff' : '#a1a1aa' }}>
                  At least 8 characters
                </li>
                <li style={{ color: /[A-Z]/.test(password) ? '#3880ff' : '#a1a1aa' }}>
                  One uppercase letter
                </li>
                <li style={{ color: /[0-9]/.test(password) ? '#3880ff' : '#a1a1aa' }}>
                  One number
                </li>
                <li style={{ color: /[^A-Za-z0-9]/.test(password) ? '#3880ff' : '#a1a1aa' }}>
                  One special character
                </li>
              </ul>
            </div>

            <IonButton
              onClick={handleOpenVerificationModal}
              expand="block"
              shape="round"
              color="primary"
              style={{ marginTop: '20px' }}
            >
              Register
            </IonButton>

            <IonButton
              routerLink="/"
              expand="block"
              fill="clear"
              shape="round"
              color="primary"
            >
              Already have an account? Sign in
            </IonButton>

            {/* Confirmation Modal */}
            <IonModal isOpen={showVerificationModal} onDidDismiss={() => setShowVerificationModal(false)}>
              <IonContent className="ion-padding">
                <IonCard className="ion-padding" style={{ marginTop: '25%', background: '#1e1e1e' }}>
                  <IonCardHeader>
                    <IonCardTitle style={{ color: 'white' }}>User Registration Details</IonCardTitle>
                    <hr style={{ borderColor: '#333' }} />
                    <IonCardSubtitle style={{ color: '#a1a1aa' }}>Username</IonCardSubtitle>
                    <IonCardTitle style={{ color: 'white' }}>{username}</IonCardTitle>

                    <IonCardSubtitle style={{ color: '#a1a1aa' }}>Email</IonCardSubtitle>
                    <IonCardTitle style={{ color: 'white' }}>{email}</IonCardTitle>

                    <IonCardSubtitle style={{ color: '#a1a1aa' }}>Name</IonCardSubtitle>
                    <IonCardTitle style={{ color: 'white' }}>
                      {firstName} {lastName}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent></IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '5px' }}>
                    <IonButton fill="clear" onClick={() => setShowVerificationModal(false)}>
                      Cancel
                    </IonButton>
                    <IonButton color="primary" onClick={doRegister}>
                      Confirm
                    </IonButton>
                  </div>
                </IonCard>
              </IonContent>
            </IonModal>

            {/* Success Modal */}
            <IonModal isOpen={showSuccessModal} onDidDismiss={() => setShowSuccessModal(false)}>
              <IonContent
                className="ion-padding"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100vh',
                  textAlign: 'center',
                  background: '#1e1e1e'
                }}
              >
                <IonTitle style={{ marginTop: '35%', color: 'white' }}>Registration Successful 🎉</IonTitle>
                <IonText style={{ color: '#a1a1aa' }}>
                  <p>Your account has been created successfully.</p>
                  <p>Please check your email address.</p>
                </IonText>
                <IonButton routerLink="/Cephaline-Supabase" routerDirection="back" color="primary">
                  Go to Login
                </IonButton>
              </IonContent>
            </IonModal>

            <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Register;