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
  IonSpinner
} from '@ionic/react';
import { copyOutline } from 'ionicons/icons';
import { supabase } from '../../utils/supaBaseClient';
import * as otplib from 'otplib';

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

  // Generate a proper TOTP secret
  const generateNewSecret = useCallback((): string => {
    return otplib.authenticator.generateSecret(); // Generates a base32 secret
  }, []);

  const checkTotpStatus = useCallback(async (): Promise<{ enabled: boolean, secret?: string }> => {
    try {
      const { data, error } = await supabase
        .from('user_totp_secrets')
        .select('secret')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return {
        enabled: !!data?.secret,
        secret: data?.secret
      };
    } catch (error) {
      console.error('Error checking TOTP status:', error);
      return { enabled: false };
    }
  }, [userId]);

  useEffect(() => {
    const initialize = async () => {
      if (userId) {
        setIsLoading(true);
        try {
          const { enabled, secret } = await checkTotpStatus();
          setIsEnabled(enabled);
          if (enabled && secret) {
            setTotpSecret(secret.match(/.{4}/g)?.join(' ') || secret);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    initialize();
  }, [userId, checkTotpStatus]);

  const updateTotpStatus = useCallback(async (enable: boolean): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (enable) {
        const secret = generateNewSecret();
        
        const { error: deleteError } = await supabase
          .from('user_totp_secrets')
          .delete()
          .eq('user_id', userId);
  
        if (deleteError && deleteError.code !== 'PGRST116') throw deleteError;
  
        const { error: insertError } = await supabase
          .from('user_totp_secrets')
          .insert({
            user_id: userId,
            secret: secret,
            created_at: new Date().toISOString()
          });
  
        if (insertError) throw insertError;
  
        setTotpSecret(secret.match(/.{4}/g)?.join(' ') || secret);
        return true;
      } else {
        const { error: deleteError } = await supabase
          .from('user_totp_secrets')
          .delete()
          .eq('user_id', userId);
  
        if (deleteError && deleteError.code !== 'PGRST116') throw deleteError;
  
        setTotpSecret('');
        return true;
      }
    } catch (error: any) {
      console.error('Error updating TOTP:', error);
      setToastMessage(error.message || 'Failed to update TOTP');
      setShowToast(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, generateNewSecret]);

  const handleToggle = async (event: CustomEvent) => {
    const enabled = event.detail.checked;
    if (isLoading) return;

    const success = await updateTotpStatus(enabled);
    if (success) {
      setIsEnabled(enabled);
      onToggleChange?.(enabled);
    } else {
      setIsEnabled(!enabled); // Revert if failed
    }
  };

  const copyToClipboard = async () => {
    if (!totpSecret) return;
    try {
      await navigator.clipboard.writeText(totpSecret.replace(/\s/g, ''));
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
    </div>
  );
};

export default TotpToggle;