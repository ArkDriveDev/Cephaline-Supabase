import React, { useState } from 'react';
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
import { supabase } from '../utils/supaBaseClient';

interface RecoveryCodeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onTryAnotherWay?: () => void;
  userId: string;
}

const RecoveryCodeLoginModal: React.FC<RecoveryCodeLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onTryAnotherWay,
  userId
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

const verifyRecoveryCode = async (rawCode: string): Promise<boolean> => {
  if (!userId) {
    setError('User not identified');
    return false;
  }

  const cleanCode = rawCode.trim();

  try {
    // Step 1: Check if code exists and is active for this user
    const { data: codeRecord, error: findError } = await supabase
      .from('recovery_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code_hash', cleanCode) // Direct comparison with plain text code
      .eq('code_status', 'active')
      .maybeSingle();

    if (findError) throw findError;
    if (!codeRecord) return false;

    // Step 2: Mark only this specific code as used using both parts of the composite key
    const { error: updateError } = await supabase
      .from('recovery_codes')
      .update({
        code_status: 'used',
        used_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('code_hash', cleanCode); // Update only the exact matching code

    if (updateError) throw updateError;

    return true;
  } catch (err) {
    console.error('Recovery code verification error:', err);
    return false;
  }
};
  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please enter a recovery code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isValid = await verifyRecoveryCode(code.trim());
      
      if (isValid) {
        setShowSuccessToast(true);
        setTimeout(() => {
          onLoginSuccess();
          onClose();
        }, 1500);
      } else {
        setError('Invalid or already used recovery code');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Use Recovery Code</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonText>
                <p>Enter one of your recovery codes to authenticate.</p>
              </IonText>
              
              <IonInput
                value={code}
                onIonChange={(e) => setCode(e.detail.value || '')}
                placeholder="e.g., 12345678"
                className={error ? 'ion-invalid' : ''}
                clearInput
                disabled={isSubmitting}
                inputMode="numeric"
              />
              
              {error && (
                <IonText color="danger" className="ion-text-center">
                  <p>{error}</p>
                </IonText>
              )}
              
              <div className="ion-margin-top">
                <IonButton
                  expand="block"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !code.trim()}
                >
                  {isSubmitting ? <IonSpinner name="crescent" /> : 'Verify Code'}
                </IonButton>
              </div>
              
              {onTryAnotherWay && (
                <IonButton
                  fill="clear"
                  expand="block"
                  onClick={onTryAnotherWay}
                  disabled={isSubmitting}
                >
                  Try Another Method
                </IonButton>
              )}
            </IonCol>
          </IonRow>
        </IonGrid>
        
        <IonToast
          isOpen={showSuccessToast}
          onDidDismiss={() => setShowSuccessToast(false)}
          message="Recovery code accepted!"
          duration={1500}
          color="success"
          position="top"
        />
      </IonContent>
    </IonModal>
  );
};

export default RecoveryCodeLoginModal;