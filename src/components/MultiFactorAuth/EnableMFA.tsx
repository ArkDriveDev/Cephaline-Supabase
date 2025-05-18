import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonToggle,
  IonLabel,
  IonList,
  IonItem,
  IonText,
  IonButton,
  IonIcon,
  IonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonActionSheet,
  IonAlert,
  IonSpinner
} from '@ionic/react';
import { supabase } from '../../utils/supaBaseClient';
import {
  copyOutline,
  checkmarkDoneOutline,
  fingerPrintOutline,
  eyeOutline,
  micOutline,
  timeOutline
} from 'ionicons/icons';
import { useCopyToClipboard } from 'react-use';
import { refreshOutline } from 'ionicons/icons';
import TotpToggle from './TotpToggle';

interface User {
  id: string;
  email?: string;
}

const EnableMFA: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<{ code_hash: string, code_status: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showMFASelection, setShowMFASelection] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();
  const [selectedMFAMethod, setSelectedMFAMethod] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Check MFA status on load
  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
          setUser(user);
          
          // Check recovery codes
          const { data: codesData, error: codesError } = await supabase
            .from('recovery_codes')
            .select('code_hash, code_status')
            .eq('user_id', user.id)
            .eq('code_status', 'active');

          // Check TOTP status
          const { data: totpData, error: totpError } = await supabase
            .from('totp_codes')
            .select('code_hash')
            .eq('user_id', user.id)
            .is('used_at', null)
            .limit(1);

          const hasMFA = (codesData?.length ?? 0) > 0 || (totpData?.length ?? 0) > 0;
          
          setIsEnabled(hasMFA);
          if (codesData) setRecoveryCodes(codesData);
          if (totpData?.length) setSelectedMFAMethod('totp');
        }
      } catch (error) {
        console.error('Error checking MFA status:', error);
        setToastMessage('Failed to load MFA status');
        setShowToast(true);
      } finally {
        setLoadingUser(false);
      }
    };
    checkMFAStatus();
  }, []);

  // Generate recovery codes
  const generateRecoveryCodes = async (userId: string) => {
    const codes = Array.from({ length: 5 }, () =>
      Math.floor(10000000 + Math.random() * 90000000).toString()
    );

    const { data, error } = await supabase
      .from('recovery_codes')
      .insert(
        codes.map(code => ({
          user_id: userId,
          code_hash: code,
          code_status: 'active'
        }))
      )
      .select('code_hash, code_status');

    if (error) throw error;
    return data || [];
  };

  // Delete all recovery codes
  const deleteAllRecoveryCodes = async (userId: string) => {
    const { error } = await supabase
      .from('recovery_codes')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  };

  // Handle main toggle
  const handleToggle = async (e: CustomEvent) => {
    const enabled = e.detail.checked;
    if (enabled) {
      setShowMFASelection(true);
    } else {
      setShowDisableConfirm(true);
    }
  };

  // Handle MFA method selection
  const handleMFASelection = async (method: string) => {
    setShowMFASelection(false);
    if (method === 'cancel') return;

    setPendingToggle(true);
    try {
      if (method === 'totp') {
        setSelectedMFAMethod('totp');
      }
      const codes = await generateRecoveryCodes(user?.id || '');
      setRecoveryCodes(codes);
      setIsEnabled(true);
      setToastMessage('MFA enabled successfully!');
      setShowToast(true);
    } catch (error: any) {
      console.error('Error enabling MFA:', error);
      setToastMessage(error.message || 'Failed to enable MFA');
      setShowToast(true);
    } finally {
      setPendingToggle(false);
    }
  };

  // Disable MFA
  const confirmDisableMFA = async (confirm: boolean) => {
    setShowDisableConfirm(false);
    if (!confirm) return;

    setPendingToggle(true);
    try {
      await deleteAllRecoveryCodes(user?.id || '');
      setRecoveryCodes([]);
      setIsEnabled(false);
      setSelectedMFAMethod(null);
      setToastMessage('MFA disabled successfully!');
      setShowToast(true);
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      setToastMessage(error.message || 'Failed to disable MFA');
      setShowToast(true);
    } finally {
      setPendingToggle(false);
    }
  };

  // Copy recovery codes
  const copyCodes = () => {
    const codesText = recoveryCodes.map(code => code.code_hash).join('\n');
    copyToClipboard(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Regenerate recovery codes
  const regenerateRecoveryCodes = async () => {
    if (!user) return;

    setPendingToggle(true);
    try {
      await deleteAllRecoveryCodes(user.id);
      const newCodes = await generateRecoveryCodes(user.id);
      setRecoveryCodes(newCodes);
      setToastMessage('Recovery codes regenerated!');
      setShowToast(true);
    } catch (error: any) {
      console.error('Error regenerating codes:', error);
      setToastMessage(error.message || 'Failed to regenerate codes');
      setShowToast(true);
    } finally {
      setPendingToggle(false);
    }
  };

  if (loadingUser) {
    return (
      <IonContent className="ion-padding">
        <IonSpinner name="crescent" />
      </IonContent>
    );
  }

  return (
    <IonContent className="ion-padding">
      <IonCard>
        <IonCardContent>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
            <div style={{ flexGrow: 1 }}>
              <h2 style={{ margin: 0 }}>Multi-Factor Authentication</h2>
              <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                Add an extra layer of security to your account
              </p>
              <IonToggle
                checked={isEnabled}
                onIonChange={handleToggle}
                disabled={pendingToggle}
              />
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {isEnabled && (
        <>
          {recoveryCodes.length > 0 && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Your Recovery Codes</IonCardTitle>
                <IonButton
                  expand="block"
                  onClick={regenerateRecoveryCodes}
                  color="warning"
                  disabled={pendingToggle}
                >
                  <IonIcon slot="start" icon={refreshOutline} />
                  Regenerate All Codes
                </IonButton>
              </IonCardHeader>
              <IonCardContent>
                <IonText color="medium">
                  <p>Save these codes in a secure place. Each code can be used only once.</p>
                </IonText>

                <IonList lines="full" className="ion-margin-vertical">
                  {recoveryCodes.map((code, index) => (
                    <IonItem key={index}>
                      <IonLabel>
                        <h3>{code.code_hash}</h3>
                        <p>Status: {code.code_status}</p>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>

                <IonButton
                  expand="block"
                  onClick={copyCodes}
                  color="primary"
                >
                  <IonIcon
                    slot="start"
                    icon={copied ? checkmarkDoneOutline : copyOutline}
                  />
                  {copied ? 'Copied!' : 'Copy All Codes'}
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {selectedMFAMethod === 'totp' && (
            <TotpToggle
              userId={user?.id || ''}
              onToggleChange={(enabled) => {
                if (!enabled) {
                  setSelectedMFAMethod(null);
                }
              }}
            />
          )}
        </>
      )}

      <IonActionSheet
        isOpen={showMFASelection}
        onDidDismiss={() => handleMFASelection('cancel')}
        header="Select MFA Method"
        buttons={[
          {
            text: 'Authenticator App (TOTP)',
            icon: timeOutline,
            handler: () => handleMFASelection('totp')
          },
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => handleMFASelection('cancel')
          }
        ]}
      />

      <IonAlert
        isOpen={showDisableConfirm}
        onDidDismiss={() => confirmDisableMFA(false)}
        header="Disable MFA?"
        message="Are you sure you want to disable Multi-Factor Authentication? This will make your account less secure."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => confirmDisableMFA(false)
          },
          {
            text: 'Disable',
            handler: () => confirmDisableMFA(true)
          }
        ]}
      />

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

export default EnableMFA;