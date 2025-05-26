import React, { useState, useEffect } from 'react';
import { 
  IonCol, 
  IonGrid, 
  IonInput, 
  IonRow, 
  IonText,
  IonProgressBar 
} from '@ionic/react';
import { IonInputPasswordToggle } from '@ionic/react';

interface PasswordChangeFormProps {
  password: string;
  confirmPassword: string;
  currentPassword: string;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setCurrentPassword: (value: string) => void;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  password,
  confirmPassword,
  currentPassword,
  setPassword,
  setConfirmPassword,
  setCurrentPassword,
}) => {
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
    
    // Length checks
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character diversity checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Determine strength level
    if (strength <= 2) return { value: 0.25, label: 'Very Weak', color: 'danger' };
    if (strength <= 4) return { value: 0.5, label: 'Weak', color: 'warning' };
    if (strength <= 6) return { value: 0.75, label: 'Strong', color: 'success' };
    return { value: 1, label: 'Very Strong', color: 'primary' };
  };

  return (
    <>
      <IonGrid>
        <IonRow>
          <IonText color="secondary">
            <h3>Change Password</h3>
          </IonText>
          <IonCol size="12">
            <IonInput
              label="New Password"
              type="password"
              labelPlacement="floating"
              fill="outline"
              placeholder="Enter New Password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>
            
            {password && (
              <div style={{ marginTop: '8px' }}>
                <IonProgressBar 
                  value={passwordStrength.value} 
                  color={passwordStrength.color}
                  style={{ height: '4px' }}
                />
                <IonText color={passwordStrength.color} style={{ fontSize: '12px' }}>
                  Strength: {passwordStrength.label}
                </IonText>
              </div>
            )}
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonGrid>
        <IonRow>
          <IonCol size="12">
            <IonInput
              label="Confirm Password"
              type="password"
              labelPlacement="floating"
              fill="outline"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onIonChange={(e) => setConfirmPassword(e.detail.value!)}
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>
          </IonCol>
        </IonRow>

        {/* Moved password requirements checklist here */}
        {password && (
          <IonRow>
            <IonCol size="12">
              <div style={{ 
                color: '#666',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                <p>Password should contain:</p>
                <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                  <li style={{ color: password.length >= 8 ? '#2dd36f' : '#666' }}>
                    At least 8 characters
                  </li>
                  <li style={{ color: /[A-Z]/.test(password) ? '#2dd36f' : '#666' }}>
                    One uppercase letter
                  </li>
                  <li style={{ color: /[0-9]/.test(password) ? '#2dd36f' : '#666' }}>
                    One number
                  </li>
                  <li style={{ color: /[^A-Za-z0-9]/.test(password) ? '#2dd36f' : '#666' }}>
                    One special character
                  </li>
                </ul>
              </div>
            </IonCol>
          </IonRow>
        )}
      </IonGrid>

      <IonGrid>
        <IonRow>
          <IonText color="secondary">
            <h3>Confirm Changes</h3>
          </IonText>
          <IonCol size="12">
            <IonInput
              label="Current Password"
              type="password"
              labelPlacement="floating"
              fill="outline"
              placeholder="Enter Current Password to Save Changes"
              value={currentPassword}
              onIonChange={(e) => setCurrentPassword(e.detail.value!)}
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default PasswordChangeForm;