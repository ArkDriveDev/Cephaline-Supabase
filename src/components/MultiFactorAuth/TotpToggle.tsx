import React, { useState, useEffect, useCallback } from 'react';
import {
  IonToggle,
  IonLabel,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonText,
  IonSpinner,
  IonAlert
} from '@ionic/react';
import { copyOutline } from 'ionicons/icons';
import { supabase } from '../../utils/supaBaseClient';
import { TOTP } from 'otpauth';

interface TotpToggleProps {
  userId: string;
  initialEnabled?: boolean;
  onToggleChange?: (enabled: boolean) => void;
  disabled?: boolean;
}

const TotpToggle: React.FC<TotpToggleProps> = ({
  userId,
  initialEnabled = false,
  onToggleChange,
  disabled
}) => {
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [showDisableAlert, setShowDisableAlert] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Generate a new TOTP secret
  const generateNewSecret = useCallback((): string => {
    const totp = new TOTP({
      issuer: 'Cephaline-Supabase',
      label: 'Cephaline-Supabase:' + userId,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    return totp.secret.base32;
  }, [userId]);

  // Check if TOTP is enabled by looking for active secrets
  const checkTotpStatus = useCallback(async (): Promise<{ enabled: boolean, secret?: string, isVerified?: boolean }> => {
    try {
      const { data, error } = await supabase
        .from('user_totp')
        .select('secret, is_verified')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return {
        enabled: !!data?.secret,
        secret: data?.secret,
        isVerified: data?.is_verified || false
      };
    } catch (error) {
      console.error('Error checking TOTP status:', error);
      return { enabled: false, isVerified: false };
    }
  }, [userId]);

 useEffect(() => {
  const initialize = async () => {
    if (userId) {
      setIsLoading(true);
      try {
        const response = await checkTotpStatus();
        console.log(response); // For debugging
        const { enabled, secret, isVerified } = response;
        setIsEnabled(enabled);
        setIsVerified(isVerified ?? false); // Provide fallback
        if (enabled && secret) {
          setTotpSecret(secret);
        }
      } catch (error) {
        console.error("Error checking TOTP status:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  initialize();
}, [userId, checkTotpStatus, setIsEnabled, setIsVerified, setTotpSecret, setIsLoading]);

  const enableTotp = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const secret = generateNewSecret();
      
      // Store the secret with is_verified false initially
      const { error } = await supabase
        .from('user_totp')
        .upsert({
          user_id: userId,
          secret: secret,
          is_verified: false,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setTotpSecret(secret);
      setIsVerified(false);
      return true;
    } catch (error: any) {
      console.error('Error enabling TOTP:', error);
      setToastMessage(error.message || 'Failed to enable TOTP');
      setShowToast(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disableTotp = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Delete the TOTP record
      const { error } = await supabase
        .from('user_totp')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setTotpSecret('');
      setIsVerified(false);
      return true;
    } catch (error: any) {
      console.error('Error disabling TOTP:', error);
      setToastMessage(error.message || 'Failed to disable TOTP');
      setShowToast(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (event: CustomEvent) => {
    const enabled = event.detail.checked;
    if (isLoading) return;

    if (enabled) {
      const success = await enableTotp();
      if (success) {
        setIsEnabled(true);
        onToggleChange?.(true);
      }
    } else {
      setShowDisableAlert(true);
    }
  };

  const confirmDisable = async () => {
    setShowDisableAlert(false);
    const success = await disableTotp();
    if (success) {
      setIsEnabled(false);
      onToggleChange?.(false);
    }
  };

  const copyToClipboard = async () => {
    if (!totpSecret) return;
    try {
      await navigator.clipboard.writeText(totpSecret);
      setToastMessage('Copied to clipboard!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Copy failed');
      setShowToast(true);
    }
  };

  return (
    <div className="ion-padding">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <IonLabel>
          <strong>Authenticator App (TOTP)</strong>
        </IonLabel>
        {isLoading ? (
          <IonSpinner name="crescent" />
        ) : (
          <IonToggle
            checked={isEnabled}
            onIonChange={handleToggle}
            disabled={isLoading || disabled}
          />
        )}
      </div>

      {isEnabled && (
        <>
          <IonCard>
            <IonCardContent>
              <IonGrid>
                <IonRow className="ion-align-items-center">
                  <IonCol>
                    <IonText>
                      <h3 style={{ margin: 0 }}>Secret Key:</h3>
                      <p style={{
                        fontFamily: 'monospace',
                        fontSize: '1.1rem',
                        letterSpacing: '1px',
                        wordBreak: 'break-all',
                        margin: '8px 0',
                        userSelect: 'all'
                      }}>
                        {totpSecret || 'Loading...'}
                      </p>
                      {!isVerified && (
                        <IonText color="warning">
                          <p>This secret key is not yet verified. Please complete setup in your authenticator app.</p>
                        </IonText>
                      )}
                    </IonText>
                  </IonCol>
                  <IonCol size="auto">
                    <IonButton
                      fill="clear"
                      onClick={copyToClipboard}
                      disabled={!totpSecret}
                    >
                      <IonIcon icon={copyOutline} />
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          <div style={{ marginTop: '16px' }}>
            <IonText color="medium">
              <p><strong>How to setup:</strong></p>
              <ol style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>Copy the secret key above</li>
                <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Select "Enter a setup key" or similar option</li>
                <li>Enter your account name (e.g., your email)</li>
                <li>Paste the secret key</li>
                <li>Select "Time-based" if given an option</li>
                <li>Save the entry</li>
              </ol>
              <p style={{ marginTop: '8px' }}>
                <strong>Note:</strong> You'll need to enter the 6-digit code from your authenticator app when logging in.
              </p>
            </IonText>
          </div>
        </>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
      />

      <IonAlert
        isOpen={showDisableAlert}
        onDidDismiss={() => setShowDisableAlert(false)}
        header={'Disable Two-Factor Authentication?'}
        message={'Are you sure you want to disable this security feature?'}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Disable',
            handler: confirmDisable
          }
        ]}
      />
    </div>
  );
};

export default TotpToggle;