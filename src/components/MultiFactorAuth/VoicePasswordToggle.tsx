import React, { useState, useEffect } from 'react';
import {
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonSpinner,
  IonToggle,
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
} from '@ionic/react';
import { supabase } from '../../utils/supaBaseClient';
import { eye, eyeOff } from 'ionicons/icons';
import bcrypt from 'bcryptjs';

interface VoicePasswordToggleProps {
  initialEnabled: boolean;
  onToggleChange: (enabled: boolean) => void;
  disabled: boolean;
}

const VoicePasswordToggle: React.FC<VoicePasswordToggleProps> = ({
  initialEnabled,
  onToggleChange,
  disabled
}) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [voicePassword, setVoicePassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('success');
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkAuthAndPassword = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await checkExistingVoicePassword();
      }
      setIsInitializing(false);
    };

    checkAuthAndPassword();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await checkExistingVoicePassword();
      } else if (event === 'SIGNED_OUT') {
        setEnabled(false);
        setHasExistingPassword(false);
        setVoicePassword('');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const checkExistingVoicePassword = async () => {
    try {
      setIsProcessing(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('No authenticated user');
        setEnabled(false);
        setHasExistingPassword(false);
        return;
      }

      const { data: voicePasswordData, error } = await supabase
        .from('user_voice_passwords')
        .select('password')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !voicePasswordData) {
        console.log('No existing voice password found');
        setEnabled(false);
        setHasExistingPassword(false);
        return;
      }

      // We don't decrypt the password here, we just check if it exists
      setVoicePassword(''); // Clear the plain text password
      setHasExistingPassword(true);
      setEnabled(true);
      onToggleChange(true);
    } catch (error) {
      console.error('Error checking for voice password:', error);
      setEnabled(false);
      setHasExistingPassword(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleChange = async (checked: boolean) => {
    if (!checked && hasExistingPassword) {
      await handleCancel();
    } else {
      setVoicePassword('');
      setEnabled(checked);
      onToggleChange(checked);
    }
  };

  const handleSubmit = async () => {
    const upperCasePassword = voicePassword.trim().toUpperCase();
    
    if (!upperCasePassword) {
      setToastMessage('Please enter a voice password');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Hash the password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(upperCasePassword, salt);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'Not authenticated');

      const { error } = await supabase
        .from('user_voice_passwords')
        .upsert({
          user_id: user.id,
          password: hashedPassword
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setToastMessage('Voice password saved successfully');
      setToastColor('success');
      setVoicePassword(''); // Clear the plain text password after hashing
      setEnabled(true);
      setHasExistingPassword(true);
      onToggleChange(true);
    } catch (error) {
      console.error('Error saving voice password:', error);
      setToastMessage('Failed to save voice password');
      setToastColor('danger');
      setEnabled(false);
      onToggleChange(false);
    } finally {
      setIsProcessing(false);
      setShowToast(true);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_voice_passwords')
          .delete()
          .eq('user_id', user.id);
      }

      setVoicePassword('');
      setEnabled(false);
      setHasExistingPassword(false);
      onToggleChange(false);
      setToastMessage('Voice password removed');
      setToastColor('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error removing voice password:', error);
      setToastMessage('Failed to remove voice password');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isInitializing) {
    return <IonSpinner name="crescent" />;
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <IonLabel style={{ marginLeft: '1rem' }}>
          <strong>Enable Voice Password</strong>
        </IonLabel>
        {isProcessing ? (
          <IonSpinner style={{ marginLeft: '1rem' }} name="crescent" />
        ) : (
          <IonToggle
            style={{ marginLeft: '1rem' }}
            checked={enabled}
            onIonChange={(e) => handleToggleChange(e.detail.checked)}
            disabled={disabled || isProcessing}
          />
        )}
      </div>

      {enabled && (
        <IonCard style={{ width: '100%', maxWidth: '400px', marginLeft: '1rem' }}>
          <IonCardContent>
            {hasExistingPassword ? (
              <>
                <IonItem>
                  <IonInput
                    label="Your voice password is saved"
                    labelPlacement="floating"
                    value="********"
                    disabled
                    type={showPassword ? 'text' : 'password'}
                  />
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isProcessing || disabled}
                  >
                    <IonIcon icon={showPassword ? eyeOff : eye} />
                  </IonButton>
                </IonItem>
                <div style={{ display: 'flex', marginTop: '1rem', gap: '1rem' }}>
                  <IonButton
                    color="danger"
                    onClick={handleCancel}
                    disabled={isProcessing || disabled}
                  >
                    Remove Voice Password
                  </IonButton>
                </div>
              </>
            ) : (
              <>
                <IonItem>
                  <IonInput
                    label="Enter voice password"
                    labelPlacement="floating"
                    value={voicePassword}
                    onIonChange={(e) => setVoicePassword(e.detail.value!.toUpperCase())}
                    disabled={isProcessing || disabled}
                    type={showPassword ? 'text' : 'password'}
                  />
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isProcessing || disabled}
                  >
                    <IonIcon icon={showPassword ? eyeOff : eye} />
                  </IonButton>
                </IonItem>
                <div style={{ display: 'flex', marginTop: '1rem', gap: '1rem' }}>
                  <IonButton
                    onClick={handleSubmit}
                    disabled={isProcessing || disabled || !voicePassword.trim()}
                  >
                    {isProcessing ? 'Saving...' : 'Submit'}
                  </IonButton>
                  <IonButton
                    fill="outline"
                    color="danger"
                    onClick={handleCancel}
                    disabled={isProcessing || disabled}
                  >
                    Cancel
                  </IonButton>
                </div>
              </>
            )}
          </IonCardContent>
        </IonCard>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        color={toastColor}
        position="top"
      />
    </>
  );
};

export default VoicePasswordToggle;