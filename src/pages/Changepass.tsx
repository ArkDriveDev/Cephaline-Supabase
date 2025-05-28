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
    const parseUrlParams = () => {
      try {
        // Get the hash part of the URL (after #)
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash.split('?')[1] || '');
        
        // Get the email and token from hash parameters
        const emailParam = hashParams.get('email');
        const tokenParam = hashParams.get('access_token');
        const typeParam = hashParams.get('type');

        if (!emailParam || !tokenParam || typeParam !== 'recovery') {
          setMessage('Invalid or expired password reset link');
          setShowAlert(true);
          setTimeout(() => {
            history.push('/');
          }, 3000);
          return;
        }

        setEmail(decodeURIComponent(emailParam));
        setToken(tokenParam);
      } catch (error) {
        console.error('Error parsing URL:', error);
        setMessage('Invalid password reset link');
        setShowAlert(true);
        setTimeout(() => {
          history.push('/');
        }, 3000);
      }
    };

    parseUrlParams();
  }, [history]);

  // Password strength calculator (keep your existing implementation)
  useEffect(() => {
    // ... (keep your existing password strength logic)
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
      // First verify the token with the email
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });

      if (verifyError) {
        throw verifyError;
      }

      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setMessage('Password updated successfully! Redirecting...');
      setShowToast(true);
      
      setTimeout(() => {
        history.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setMessage(error.message || 'Password reset failed. The link may have expired or is invalid.');
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

          {/* Display the email in a read-only field */}
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
            disabled={loading}
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