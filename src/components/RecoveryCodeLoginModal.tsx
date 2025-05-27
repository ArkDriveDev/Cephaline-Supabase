import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonIcon,
  IonToast,
} from '@ionic/react';
import { close } from 'ionicons/icons';

interface RecoveryCodeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<boolean>;
  onLoginSuccess?: () => void;
  onTryAnotherWay?: () => void;
  userId: string;
}

const RecoveryCodeLoginModal: React.FC<RecoveryCodeLoginModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onLoginSuccess,
  onTryAnotherWay,
  userId
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please enter a recovery code');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const isValid = await onSubmit(code.trim());
      if (isValid) {
        setToastMessage('Login successful!');
        setShowToast(true);
        onLoginSuccess?.();
      } else {
        setError('Invalid recovery code');
        setToastMessage('Invalid recovery code');
        setShowToast(true);
      }
    } catch (err) {
      setError('Verification failed');
      setToastMessage('An error occurred');
      setShowToast(true);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setCode('');
    setError('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setError('');
    }
  }, [isOpen]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Use Recovery Code</IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleDismiss}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8">
              <IonText>
                <p className="ion-text-center">
                  Enter a recovery code to sign in. Each code can only be used once.
                </p>
              </IonText>

              <div className="ion-text-center" style={{ margin: '20px 0' }}>
                <IonInput
                  value={code}
                  onIonChange={(e) => {
                    const value = e.detail.value || '';
                    setCode(value);
                    setError('');
                  }}
                  placeholder="Enter your recovery code"
                  autofocus
                  clearOnEdit
                  class={error ? 'ion-invalid' : ''}
                  style={{
                    fontSize: '18px',
                    textAlign: 'center',
                    border: error ? '2px solid var(--ion-color-danger)' : '1px solid var(--ion-color-medium)',
                    borderRadius: '8px',
                    padding: '10px',
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto'
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <IonText color="danger">
                  <p className="ion-text-center" style={{ fontSize: '14px' }}>{error}</p>
                </IonText>
              )}
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size="12" sizeMd="8">
              <IonButton
                expand="block"
                onClick={handleSubmit}
                disabled={isSubmitting || !code.trim()}
              >
                {isSubmitting ? <IonSpinner name="crescent" /> : 'Verify Code'}
              </IonButton>

              {onTryAnotherWay && (
                <IonButton
                  fill="clear"
                  expand="block"
                  color="dark"
                  onClick={onTryAnotherWay}
                  disabled={isSubmitting}
                >
                  Try another way
                </IonButton>
              )}
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={1500}
          position="top"
          color={toastMessage === 'Login successful!' ? 'success' : 'danger'}
        />
      </IonContent>
    </IonModal>
  );
};

export default RecoveryCodeLoginModal;