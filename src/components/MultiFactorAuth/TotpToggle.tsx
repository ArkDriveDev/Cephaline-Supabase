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
  initialEnabled: boolean;
  onToggleChange?: (enabled: boolean) => void;
  userId: string;
}

const TotpToggle: React.FC<TotpToggleProps> = ({
  initialEnabled,
  onToggleChange,
  userId
}) => {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // More reliable secret generation
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

  const deleteUnusedTotpCodes = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase
        .from('totp_codes')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Delete error:', error);
      throw new Error('Failed to remove old codes');
    }
  }, [userId]);

  const storeSecretInDatabase = useCallback(async (secret: string): Promise<void> => {
    try {
      await deleteUnusedTotpCodes();
      
      const { error } = await supabase
        .from('totp_codes')
        .insert({
          user_id: userId,
          code_hash: secret.replace(/\s/g, ''), // Store without spaces
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Store error:', error);
      throw new Error('Failed to setup TOTP');
    }
  }, [userId, deleteUnusedTotpCodes]);

  const checkExistingSecret = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('totp_codes')
        .select('code_hash')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data?.[0]?.code_hash) {
        setTotpSecret(data[0].code_hash.match(/.{4}/g)?.join(' ') || data[0].code_hash);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Check error:', error);
      return false;
    }
  }, [userId]);

  const initializeTOTP = useCallback(async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const secret = generateNewSecret();
      await storeSecretInDatabase(secret);
      setTotpSecret(secret);
      setToastMessage('TOTP setup complete!');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message);
      setShowToast(true);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [generateNewSecret, storeSecretInDatabase]);

  const disableTOTP = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await deleteUnusedTotpCodes();
      setTotpSecret('');
      setToastMessage('TOTP disabled');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message);
      setShowToast(true);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [deleteUnusedTotpCodes]);

  useEffect(() => {
    if (initialEnabled && userId && !totpSecret) {
      const checkSecret = async () => {
        try {
          const hasSecret = await checkExistingSecret();
          if (!hasSecret) {
            await initializeTOTP();
          }
        } catch (error) {
          console.error('Initialization error:', error);
        }
      };
      checkSecret();
    }
  }, [initialEnabled, userId, totpSecret, checkExistingSecret, initializeTOTP]);

  const handleToggle = async (event: CustomEvent) => {
    const enabled = event.detail.checked;
    if (isLoading || isGenerating) return;
    
    setIsLoading(true);
    try {
      if (enabled) {
        await initializeTOTP();
      } else {
        await disableTOTP();
      }
      setIsEnabled(enabled);
      onToggleChange?.(enabled);
    } catch (error) {
      console.error('Toggle error:', error);
      setIsEnabled(!enabled); // Revert on error
    } finally {
      setIsLoading(false);
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
          <strong>TOTP Authentication</strong>
        </IonLabel>
        {(isLoading || isGenerating) ? (
          <IonSpinner name="crescent" />
        ) : (
          <IonToggle
            checked={isEnabled}
            onIonChange={handleToggle}
            disabled={isLoading || isGenerating}
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
                        {isGenerating ? (
                          <>
                            <IonSpinner name="dots" style={{ marginRight: '8px' }} />
                            Generating...
                          </>
                        ) : (
                          totpSecret
                        )}
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="auto">
                    <IonButton
                      fill="clear"
                      onClick={copyToClipboard}
                      disabled={!totpSecret || isGenerating}
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