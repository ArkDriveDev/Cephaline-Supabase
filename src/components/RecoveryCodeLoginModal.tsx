import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  IonLoading,
} from '@ionic/react';

interface RecoveryCodeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<boolean>;
  onBackTo2FA?: () => void; // Optional back button to return to regular 2FA
}

const RecoveryCodeLoginModal: React.FC<RecoveryCodeLoginModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onBackTo2FA
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCode('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError('');
    
    if (!code.trim()) {
      setError('Please enter a recovery code');
      return;
    }

    setIsSubmitting(true);
    try {
      const isValid = await onSubmit(code.trim());
      if (!isValid) {
        setError('Invalid recovery code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Recovery code verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Use Recovery Code</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText>
            <p>Enter a recovery code to sign in. Each code can only be used once.</p>
          </IonText>

          {error && (
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          )}

          <IonItem>
            <IonLabel position="stacked">Recovery Code</IonLabel>
            <IonInput
              value={code}
              onIonChange={(e) => setCode(e.detail.value!)}
              placeholder="Enter your recovery code"
              autofocus={true}
              clearOnEdit={false}
            />
          </IonItem>

          <div style={{ marginTop: '20px' }}>
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              Verify Code
            </IonButton>

            {onBackTo2FA && (
              <IonButton
                expand="block"
                fill="clear"
                onClick={onBackTo2FA}
                disabled={isSubmitting}
              >
                Back to Authenticator Code
              </IonButton>
            )}
          </div>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isSubmitting} message="Verifying code..." />
    </>
  );
};

export default RecoveryCodeLoginModal;