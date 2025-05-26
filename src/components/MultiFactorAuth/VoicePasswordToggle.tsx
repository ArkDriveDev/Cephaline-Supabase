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
} from '@ionic/react';
import { supabase } from '../../utils/supaBaseClient';

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

  useEffect(() => {
    checkExistingVoicePassword();
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
        return;
      }

      const { data: voicePasswordData, error } = await supabase
        .from('user_voice_passwords')
        .select('password')
        .eq('user_id', user.id)
        .single();

      if (error || !voicePasswordData) {
        console.log('No existing voice password found');
        return;
      }

      setVoicePassword(voicePasswordData.password);
      setHasExistingPassword(true);
      setEnabled(true);
      onToggleChange(true);
    } catch (error) {
      console.error('Error checking for voice password:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleChange = async (checked: boolean) => {
    if (!checked && hasExistingPassword) {
      // If turning off and there's an existing password, delete it
      await handleCancel();
    } else {
      // Otherwise just update local state
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'Not authenticated');

      const { error } = await supabase
        .from('user_voice_passwords')
        .upsert({
          user_id: user.id,
          password: upperCasePassword
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setToastMessage('Voice password saved successfully');
      setToastColor('success');
      setVoicePassword(upperCasePassword);
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
                <IonInput
                  label="Your voice password is saved"
                  labelPlacement="floating"
                  value="********"
                  disabled
                  type="password"
                />
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
                <IonInput
                  label="Enter voice password"
                  labelPlacement="floating"
                  value={voicePassword}
                  onIonChange={(e) => setVoicePassword(e.detail.value!.toUpperCase())}
                  disabled={isProcessing || disabled}
                  type="password"
                />
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