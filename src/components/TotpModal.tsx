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
import { supabase } from '../utils/supaBaseClient';
import { TOTP } from 'otpauth';
import { useState } from 'react';
import { close } from 'ionicons/icons';

interface TotpModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  session: any;
  onVerificationSuccess: (session: any) => void;
  onTryAnotherWay: () => void;
}

const TotpModal: React.FC<TotpModalProps> = ({
  isOpen,
  onDidDismiss,
  session,
  onVerificationSuccess,
  onTryAnotherWay,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const verifyCode = async (code: string, secret: string) => {
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      throw new Error('Code must be 6 digits');
    }

    const totp = new TOTP({
      secret: secret,
      digits: 6,
      period: 30,
      algorithm: 'SHA1'
    });

    const isValid = totp.validate({ token: code, window: 1 }) !== null;

    if (!isValid) {
      throw new Error('Invalid verification code');
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const { data: totpData, error: totpError } = await supabase
        .from('user_totp')
        .select('secret, is_verified')
        .eq('user_id', session.user?.id)
        .single();

      if (totpError || !totpData?.secret) {
        throw totpError || new Error('TOTP not configured for this user');
      }

      await verifyCode(code, totpData.secret);

      if (!totpData.is_verified) {
        const { error: updateError } = await supabase
          .from('user_totp')
          .update({ is_verified: true })
          .eq('user_id', session.user?.id);
        if (updateError) throw updateError;
      }

      const { data: { session: newSession }, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      onVerificationSuccess(newSession);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      if (err.message === 'Invalid verification code') {
        setToastMessage('Invalid verification code');
        setShowToast(true);
      }
      console.error('TOTP verification failed:', err);
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
                  Enter the 6-digit code from your authenticator app
                </p>
              </IonText>

              <div className="ion-text-center" style={{ margin: '20px 0' }}>
                <IonInput
                  value={code}
                  onIonChange={(e) => {
                    const value = e.detail.value || '';
                    const numericValue = value.replace(/\D/g, '');
                    setCode(numericValue.slice(0, 6));
                    setError('');
                  }}
                  placeholder="123456"
                  inputMode="numeric"
                  maxlength={6}
                  autofocus
                  clearOnEdit
                  class={error ? 'ion-invalid' : ''}
                  style={{
                    fontSize: '24px',
                    textAlign: 'center',
                    letterSpacing: '10px',
                    border: error ? '2px solid var(--ion-color-danger)' : '1px solid var(--ion-color-medium)',
                    borderRadius: '8px',
                    padding: '10px',
                    width: '200px',
                    margin: '0 auto'
                  }}
                  disabled={isVerifying}
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
                onClick={handleVerify}
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying ? <IonSpinner name="crescent" /> : 'Verify'}
              </IonButton>

              <IonButton
                fill="clear"
                expand="block"
                color="dark"
                onClick={onTryAnotherWay}
                disabled={isVerifying}
              >
                Try another way
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={1500}
          position="top"
          color="danger"
        />
      </IonContent>
    </IonModal>
  );
};

export default TotpModal;