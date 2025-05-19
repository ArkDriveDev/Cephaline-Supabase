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

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleToggleChange = (checked: boolean) => {
    if (!checked) {
      setVoicePassword('');
    }
    setEnabled(checked);
    onToggleChange(checked);
  };

  const handleSubmit = async () => {
    if (!voicePassword.trim()) {
      setToastMessage('Please enter a voice password');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    setIsProcessing(true);

    try {
      await saveVoicePassword(voicePassword);
      setToastMessage('Voice password saved successfully');
      setToastColor('success');
      setEnabled(true);
      onToggleChange(true);
    } catch {
      setToastMessage('Failed to save voice password');
      setToastColor('danger');
      setEnabled(false);
      onToggleChange(false);
    } finally {
      setIsProcessing(false);
      setShowToast(true);
    }
  };

  const handleCancel = () => {
    setVoicePassword('');
    setEnabled(false);
    onToggleChange(false);
  };

  const saveVoicePassword = async (password: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Saving voice password:', password);
        resolve({ success: true });
      }, 1000);
    });
  };

  return (
    <>
      {/* Label and Toggle: side by side, left aligned */}
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

      {/* Show form if enabled */}
      {enabled && (
        <IonCard style={{ width: '100%', maxWidth: '400px', marginLeft: '1rem' }}>
          <IonCardContent>
            <IonInput
              label="Enter voice password"
              labelPlacement="floating"
              value={voicePassword}
              onIonChange={(e) => setVoicePassword(e.detail.value!)}
              disabled={isProcessing || disabled}
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
