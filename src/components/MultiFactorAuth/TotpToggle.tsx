import React, { useState, useEffect, useCallback } from 'react';
import {
  IonContent,
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

interface TotpToggleProps {
  userId: string;
  onToggleChange?: (enabled: boolean) => void;
}

const TotpToggle: React.FC<TotpToggleProps> = ({ userId, onToggleChange }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate TOTP secret
  const generateNewSecret = useCallback((): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const randomValues = new Uint32Array(16);
    window.crypto.getRandomValues(randomValues);
    let result = '';
    randomValues.forEach(value => {
      result += chars[value % chars.length];
    });
    return result.match(/.{4}/g)?.join(' ') || '';
  }, []);

  // Check if TOTP is already enabled
  const checkTotpStatus = useCallback(async (): Promise<{enabled: boolean, secret?: string}> => {
    try {
      const { data, error } = await supabase
        .from('totp_codes')
        .select('code_hash')
        .eq('user_id', userId)
        .is('used_at', null)
        .limit(1);

      if (error) throw error;
      return {
        enabled: !!data?.length,
        secret: data?.[0]?.code_hash
      };
    } catch (error) {
      console.error('Error checking TOTP status:', error);
      return { enabled: false };
    }
  }, [userId]);

  // Initialize component
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

  // Store or remove TOTP secret
  const updateTotpStatus = useCallback(async (enable: boolean): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (enable) {
        const secret = generateNewSecret();
        // Delete any existing codes
        await supabase
          .from('totp_codes')
          .delete()
          .eq('user_id', userId);
        
        // Insert new code
        const { error } = await supabase
          .from('totp_codes')
          .insert({
            user_id: userId,
            code_hash: secret.replace(/\s/g, ''),
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        setTotpSecret(secret);
        return true;
      } else {
        // Disable by marking all codes as used
        const { error } = await supabase
          .from('totp_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('used_at', null);

        if (error) throw error;
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
      // Revert toggle if operation failed
      setIsEnabled(!enabled);
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
    <IonContent className="ion-padding">
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
            disabled={isLoading}
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
                        margin: '8px 0'
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
              <p>How to setup:</p>
              <ol style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>Copy the secret key above</li>
                <li>Open your authenticator app</li>
                <li>Add new account and paste the key</li>
                <li>Save and use the generated codes</li>
              </ol>
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
    </IonContent>
  );
};

export default TotpToggle;