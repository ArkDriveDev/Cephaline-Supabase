import { 
  IonContent, 
  IonPage, 
  IonInput, 
  IonButton, 
  IonAlert,
  IonToast,
  IonText,
  IonProgressBar,
  IonAvatar,
  IonItem,
  IonLabel
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';
import favicon from '../images/favicon.png';
import { useHistory } from 'react-router-dom';

const ChangePass: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    value: 0,
    label: '',
    color: ''
  });
  const history = useHistory();

  // Parse URL parameters on component mount
  useEffect(() => {
    const parseUrlParams = async () => {
      try {
        console.log('Current URL:', window.location.href);
        
        // Password reset links typically have params in the query string
        const urlParams = new URLSearchParams(window.location.search);
        
        const emailParam = urlParams.get('email');
        const tokenParam = urlParams.get('access_token');
        const typeParam = urlParams.get('type');

        console.log('Extracted params:', { 
          email: emailParam, 
          token: tokenParam, 
          type: typeParam 
        });

        if (!emailParam || !tokenParam || typeParam !== 'recovery') {
          throw new Error('Missing required parameters in URL');
        }

        // Verify the token first before setting state
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: emailParam,
          token: tokenParam,
          type: 'recovery'
        });

        if (verifyError) {
          throw verifyError;
        }

        // Only set state if verification succeeds
        setEmail(decodeURIComponent(emailParam));
        setToken(tokenParam);
        
      } catch (error: any) {
        console.error('Error in parseUrlParams:', error);
        setMessage(error.message || 'Invalid or expired password reset link. Please request a new one.');
        setShowAlert(true);
        // Don't redirect automatically - let user dismiss the alert
      }
    };

    parseUrlParams();
  }, []);

  // Password strength calculator
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ value: 0, label: '', color: '' });
      return;
    }

    let strength = 0;
    if (newPassword.length >= 8) strength += 1;
    if (newPassword.length >= 12) strength += 1;
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[a-z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;

    if (strength <= 2) {
      setPasswordStrength({ value: 0.25, label: 'Very Weak', color: 'danger' });
    } else if (strength <= 4) {
      setPasswordStrength({ value: 0.5, label: 'Weak', color: 'warning' });
    } else if (strength <= 6) {
      setPasswordStrength({ value: 0.75, label: 'Strong', color: 'success' });
    } else {
      setPasswordStrength({ value: 1, label: 'Very Strong', color: 'primary' });
    }
  }, [newPassword]);

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in both password fields');
      setShowAlert(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setShowAlert(true);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      // Update the password (token already verified in useEffect)
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setMessage('Password updated successfully! Redirecting to login...');
      setShowToast(true);
      
      setTimeout(() => {
        history.push('/login'); // Redirect to login page after success
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setMessage(error.message || 'Password reset failed. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ 
        backgroundColor: '#121212',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: '#1e1e1e',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}>
          <IonAvatar style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem'
          }}>
            <img src={favicon} alt="App Logo" />
          </IonAvatar>

          <h1 style={{
            color: 'white',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            Reset Password
          </h1>

          <IonItem style={{ marginBottom: '1rem' }}>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput 
              value={email} 
              readonly 
              style={{ color: '#a1a1aa' }}
            />
          </IonItem>

          <IonInput
            label="New Password"
            labelPlacement="floating"
            fill="outline"
            type="password"
            value={newPassword}
            onIonChange={(e) => setNewPassword(e.detail.value!)}
            style={{ marginBottom: '1rem' }}
            className="custom-input"
          />

          {newPassword && (
            <div style={{ marginBottom: '1rem' }}>
              <IonProgressBar 
                value={passwordStrength.value} 
                color={passwordStrength.color}
              />
              <IonText color={passwordStrength.color} style={{ display: 'block', textAlign: 'center', marginTop: '4px' }}>
                {passwordStrength.label}
              </IonText>
            </div>
          )}

          <IonInput
            label="Confirm Password"
            labelPlacement="floating"
            fill="outline"
            type="password"
            value={confirmPassword}
            onIonChange={(e) => setConfirmPassword(e.detail.value!)}
            style={{ marginBottom: '1.5rem' }}
            className="custom-input"
          />

          <IonButton 
            expand="block" 
            onClick={handlePasswordReset}
            disabled={loading || !email || !token}
            style={{ marginTop: '1rem' }}
          >
            {loading ? 'Processing...' : 'Reset Password'}
          </IonButton>

          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            message={message}
            buttons={['OK']}
          />

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={message}
            duration={2000}
            position="top"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChangePass;