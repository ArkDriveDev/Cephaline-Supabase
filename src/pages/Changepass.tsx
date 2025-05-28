import { 
  IonContent, 
  IonPage, 
  IonInput, 
  IonButton, 
  IonAlert,
  IonToast,
  IonText,
  IonProgressBar,
  IonAvatar
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';
import favicon from '../images/favicon.png';

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

  // Parse URL parameters on component mount
  useEffect(() => {
    const parseUrlParams = () => {
      // Handle both formats:
      // Format 1: /#/changepass?email=test@test.com&token=abc123
      // Format 2: /changepass#email=test@test.com&token=abc123
      
      const hash = window.location.hash.substring(1); // Remove #
      const query = window.location.search.substring(1); // Remove ?
      
      // Combine both hash and query params
      const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : query || hash);
      
      const emailParam = params.get('email');
      const tokenParam = params.get('token');
      const typeParam = params.get('type');

      if (!emailParam || !tokenParam || typeParam !== 'recovery') {
        setMessage('Invalid or expired password reset link');
        setShowAlert(true);
        setTimeout(() => {
          window.location.href = 'https://cephaline-supabase.vercel.app/#/';
        }, 3000);
        return;
      }

      setEmail(decodeURIComponent(emailParam));
      setToken(tokenParam);
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
      // Step 1: Verify the token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });

      if (verifyError) throw verifyError;

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setMessage('Password updated successfully! Redirecting...');
      setShowToast(true);
      
      setTimeout(() => {
        window.location.href = 'https://cephaline-supabase.vercel.app/#/';
      }, 2000);
    } catch (error: any) {
      setMessage(error.message || 'Password reset failed');
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
        alignItems: 'center'
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
            marginBottom: '0.5rem'
          }}>
            Reset Password
          </h1>

          {email && (
            <p style={{
              color: '#a1a1aa',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              For: {email}
            </p>
          )}

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
              <IonText color={passwordStrength.color}>
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