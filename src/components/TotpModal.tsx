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
  IonIcon
} from '@ionic/react';
import { supabase } from '../utils/supaBaseClient';
import * as otplib from 'otplib';
import { useState } from 'react';
import { close } from 'ionicons/icons';

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
  const [isResending, setIsResending] = useState(false);

  const verifyCode = async (code: string, secret: string) => {
    // Verify code is valid format
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      throw new Error('Invalid code format');
    }

    // Check if code was already used
    const { data: existingCode } = await supabase
      .from('totp_codes')
      .select('*')
      .eq('user_id', session.user?.id)
      .eq('code', code)
      .not('used_at', 'is', null)
      .maybeSingle();

    if (existingCode) {
      throw new Error('This code was already used');
    }

    // Verify against TOTP
    if (!otplib.authenticator.check(code, secret)) {
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
      // 1. Get the user's TOTP secret
      const { data: secretData, error: secretError } = await supabase
        .from('user_totp_secrets')
        .select('secret')
        .eq('user_id', session.user?.id)
        .single();

      if (secretError) throw secretError;
      if (!secretData?.secret) {
        throw new Error('TOTP not configured for this account');
      }

      // 2. Verify the code
      await verifyCode(code, secretData.secret);

      // 3. Record code usage
      const { error: insertError } = await supabase
        .from('totp_codes')
        .insert({
          user_id: session.user?.id,
          code: code,
          secret_key: secretData.secret,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          used_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // 4. Refresh session and complete auth
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      onVerificationSuccess();
    } catch (err: any) {
      console.error('TOTP verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      // In a real app, you might want to:
      // 1. Send email/SMS with backup code
      // 2. Generate new recovery codes
      // 3. Or just show a message to check authenticator app
      setError('Please check your authenticator app for a new code');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
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
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size="12" sizeMd="8" className="ion-text-center">
              <IonButton 
                fill="clear" 
                onClick={handleResendCode}
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'Need a new code?'}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default TotpModal;