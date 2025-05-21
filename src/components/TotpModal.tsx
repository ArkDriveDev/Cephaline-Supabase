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
  IonSpinner
} from '@ionic/react';
import { supabase } from '../utils/supaBaseClient';
import * as otplib from 'otplib';
import { useState } from 'react';

interface TotpModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  session: any;
  onVerificationSuccess: () => void;
}

const TotpModal: React.FC<TotpModalProps> = ({ 
  isOpen, 
  onDidDismiss, 
  session,
  onVerificationSuccess 
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // 1. Get the user's secret from the database
      const { data, error: secretError } = await supabase
        .from('user_totp_secrets')
        .select('secret')
        .eq('user_id', session.user?.id)
        .single();

      if (secretError || !data?.secret) {
        setError('TOTP not configured for this account');
        return;
      }

      // 2. Verify the code using the secret
      const isValid = otplib.authenticator.check(
        code,
        data.secret
      );

      if (!isValid) {
        setError('Invalid verification code');
        return;
      }

      onVerificationSuccess();
    } catch (err) {
      console.error('TOTP verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDismiss = () => {
    setCode('');
    setError('');
    onDidDismiss();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Two-Factor Authentication</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8">
              <IonText>
                <p>Enter the 6-digit code from your authenticator app</p>
              </IonText>
              <IonInput
                value={code}
                onIonChange={(e) => {
                  const value = e.detail.value || '';
                  const numericValue = value.replace(/\D/g, '');
                  setCode(numericValue.slice(0, 6));
                  setError('');
                }}
                placeholder="000000"
                inputMode="numeric"
                maxlength={6}
                autofocus
                clearOnEdit
                style={{
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '10px',
                  margin: '15px 0',
                  border: error ? '2px solid var(--ion-color-danger)' : '1px solid var(--ion-color-medium)',
                  borderRadius: '8px',
                  padding: '10px'
                }}
                disabled={isVerifying}
              />
              {error && (
                <IonText color="danger">
                  <p style={{ fontSize: '14px', textAlign: 'center' }}>{error}</p>
                </IonText>
              )}
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size="12" sizeMd="8">
              <IonButton 
                expand="block" 
                onClick={handleVerify}
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? <IonSpinner name="crescent" /> : 'Verify'}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default TotpModal;