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
  const [showPassword, setShowPassword] = useState(false);

  // Check for existing voice password when component mounts or when enabled changes
  useEffect(() => {
    const checkExistingVoicePassword = async () => {
      if (!enabled) return;
      
      try {
        setIsProcessing(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setEnabled(false);
          setHasExistingPassword(false);
          onToggleChange(false);
          return;
        }

        const { data: voicePasswordData, error } = await supabase
          .from('user_voice_passwords')
          .select('password')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (voicePasswordData) {
          setHasExistingPassword(true);
        } else {
          setHasExistingPassword(false);
        }
      } catch (error) {
        console.error('Error checking voice password:', error);
        setEnabled(false);
        setHasExistingPassword(false);
        onToggleChange(false);
      } finally {
        setIsProcessing(false);
      }
    };

    checkExistingVoicePassword();
  }, [enabled]);

  const handleToggleChange = async (checked: boolean) => {
    if (disabled || isProcessing) return;
    
    // If turning off and there's an existing password, confirm removal
    if (!checked && hasExistingPassword) {
      // You might want to add a confirmation dialog here
      await handleCancel();
      return;
    }
    
    // Otherwise, just update the state
    setEnabled(checked);
    onToggleChange(checked);
  };

  const handleSubmit = async () => {
    const upperCasePassword = voicePassword.trim().toUpperCase();
    
    if (!upperCasePassword) {
      showToastMessage('Please enter a voice password', 'warning');
      return;
    }

    setIsProcessing(true);

    try {
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

      showToastMessage('Voice password saved successfully', 'success');
      setVoicePassword('');
      setHasExistingPassword(true);
    } catch (error) {
      console.error('Error saving voice password:', error);
      showToastMessage('Failed to save voice password', 'danger');
      setEnabled(false);
      onToggleChange(false);
    } finally {
      setIsProcessing(false);
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
      setHasExistingPassword(false);
      setEnabled(false);
      onToggleChange(false);
      showToastMessage('Voice password removed', 'success');
    } catch (error) {
      console.error('Error removing voice password:', error);
      showToastMessage('Failed to remove voice password', 'danger');
    } finally {
      setIsProcessing(false);
    }
  };

  const showToastMessage = (message: string, color: 'success' | 'warning' | 'danger') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

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
                    onClick={() => {
                      setEnabled(false);
                      onToggleChange(false);
                      setVoicePassword('');
                    }}
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