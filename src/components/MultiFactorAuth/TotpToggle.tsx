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

  // Generate a stable secret during component lifecycle
  const generateNewSecret = useCallback((): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result.match(/.{1,4}/g)?.join('') || '';
  }, []);

  const storeSecretInDatabase = useCallback(async (secret: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Verify connection first
      const { error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;

      // Delete existing unused codes
      const { error: deleteError } = await supabase
        .from('totp_codes')
        .delete()
        .eq('user_id', userId)
        .is('used_at', null);

      if (deleteError) throw deleteError;

      // Insert new code
      const { error: insertError } = await supabase
        .from('totp_codes')
        .insert([{
          user_id: userId,
          code_hash: secret,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      return true;
    } catch (error: any) {
      console.error('Database operation failed:', error);
      setToastMessage(error.message || 'Database operation failed');
      setShowToast(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const checkExistingSecret = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('totp_codes')
        .select('code_hash')
        .eq('user_id', userId)
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data?.length) {
        setTotpSecret(data[0].code_hash);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking secret:', error);
      return false;
    }
  }, [userId]);

  const initializeTOTP = useCallback(async () => {
    const secret = generateNewSecret();
    const stored = await storeSecretInDatabase(secret);
    if (stored) {
      setTotpSecret(secret);
      setToastMessage('TOTP setup successfully!');
      setShowToast(true);
    }
  }, [generateNewSecret, storeSecretInDatabase]);

  const disableTOTP = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('totp_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('used_at', null);

      if (error) throw error;
      
      setTotpSecret('');
      setToastMessage('TOTP disabled successfully!');
      setShowToast(true);
    } catch (error: any) {
      console.error('Error disabling TOTP:', error);
      setToastMessage(error.message || 'Failed to disable TOTP');
      setShowToast(true);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Handle initial load and prop changes
  useEffect(() => {
    if (initialEnabled && userId) {
      const setup = async () => {
        const hasExisting = await checkExistingSecret();
        if (!hasExisting) {
          await initializeTOTP();
        }
      };
      setup();
    }
  }, [initialEnabled, userId, checkExistingSecret, initializeTOTP]);

  const handleToggle = async (event: CustomEvent) => {
    const enabled = event.detail.checked;
    
    try {
      if (enabled) {
        await initializeTOTP();
      } else {
        await disableTOTP();
      }
      
      setIsEnabled(enabled);
      if (onToggleChange) {
        onToggleChange(enabled);
      }
    } catch (error) {
      // Revert toggle if operation failed
      setIsEnabled(!enabled);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage('Copied to clipboard!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to copy!');
      setShowToast(true);
    }
  };

  return (
    <IonContent className="ion-padding">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <IonLabel>
          <strong>TOTP Authentication</strong>
        </IonLabel>
        {isLoading ? (
          <IonSpinner name="crescent" />
        ) : (
          <IonToggle
            checked={isEnabled}
            onIonChange={handleToggle}
            disabled={isLoading}
            aria-label="Enable TOTP"
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
                        wordBreak: 'break-all'
                      }}>
                        {totpSecret || 'Generating...'}
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="auto">
                    <IonButton
                      fill="clear"
                      onClick={() => totpSecret && copyToClipboard(totpSecret)}
                      disabled={!totpSecret}
                      aria-label="Copy secret"
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
              <p>Instructions:</p>
              <ol>
                <li>Copy this secret key</li>
                <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Add a new account and paste the key</li>
                <li>Enter the generated code when prompted</li>
              </ol>
            </IonText>
          </div>
        </>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
    </IonContent>
  );
};

export default TotpToggle;