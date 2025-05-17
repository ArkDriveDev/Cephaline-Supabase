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
  IonAlert
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
  const [showTotp, setShowTotp] = useState(false);

  // Check MFA status on mount
  useEffect(() => {
    const checkMFAStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('recovery_codes')
          .select('code_hash, code_status')
          .eq('user_id', user.id)
          .eq('code_status', 'active');

        if (!error && data && data.length > 0) {
          setIsEnabled(true);
          setRecoveryCodes(data);
        }
      }
    };
    checkMFAStatus();
  }, []);

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

  const deleteAllRecoveryCodes = async (userId: string) => {
    const { error } = await supabase
      .from('recovery_codes')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  };

  const handleToggle = async (e: CustomEvent) => {
    const enabled = e.detail.checked;
    
    // Don't update state immediately - wait for user to select method or confirm
    if (enabled) {
      setShowMFASelection(true);
    } else {
      setShowDisableConfirm(true);
    }
  };
  
  const handleMFASelection = async (method: string) => {
    setShowMFASelection(false);
  
    if (method === 'cancel') {
      // Don't change anything if cancelled
      setPendingToggle(false);
      return;
    }
  
    setSelectedMFAMethod(method);
    setPendingToggle(true);
  
    try {
      if (method === 'totp') {
        setShowTotp(true);
      }
      await toggleMFA(true);
    } finally {
      setPendingToggle(false);
    }
  };
  
  const toggleMFA = async (enable: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
  
      if (enable) {
        const codes = await generateRecoveryCodes(user.id);
        setRecoveryCodes(codes);
        setToastMessage('MFA enabled successfully!');
        setIsEnabled(true); // Only set to true after successful enable
      } else {
        await deleteAllRecoveryCodes(user.id);
        setRecoveryCodes([]);
        setToastMessage('MFA disabled successfully!');
        setIsEnabled(false); // Only set to false after successful disable
        setShowTotp(false);
        setSelectedMFAMethod(null);
      }
    } catch (error: any) {
      console.error('Error toggling MFA:', error);
      setToastMessage(error.message || 'Failed to update MFA settings');
      // Don't change isEnabled state on error
      throw error; // Re-throw to allow calling functions to handle
    } finally {
      setShowToast(true);
    }
  };
  
  const confirmDisableMFA = async (confirm: boolean) => {
    setShowDisableConfirm(false);
  
    if (confirm) {
      setPendingToggle(true);
      try {
        await toggleMFA(false);
      } finally {
        setPendingToggle(false);
      }
    }
    // If not confirmed, no state changes needed
  };
  const copyCodes = () => {
    const codesText = recoveryCodes.map(code => code.code_hash).join('\n');
    copyToClipboard(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateRecoveryCodes = async () => {
    try {
      setPendingToggle(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // First DELETE all existing codes for this user
      const { error: deleteError } = await supabase
        .from('recovery_codes')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Generate new codes (5 new 8-digit codes)
      const newCodes = Array.from({ length: 5 }, () =>
        Math.floor(10000000 + Math.random() * 90000000).toString()
      );

      // Insert new codes
      const { data: insertedCodes, error: insertError } = await supabase
        .from('recovery_codes')
        .insert(
          newCodes.map(code => ({
            user_id: user.id,
            code_hash: code,
            code_status: 'active'
          }))
        )
        .select('code_hash, code_status');

      if (insertError) throw insertError;

      setRecoveryCodes(insertedCodes || []);
      setToastMessage('Recovery codes regenerated successfully!');
      setShowToast(true);
    } catch (error: any) {
      console.error('Error regenerating codes:', error);
      setToastMessage(error.message || 'Failed to regenerate codes');
      setShowToast(true);
    } finally {
      setPendingToggle(false);
    }
  };
  return (
    <IonContent className="ion-padding">
      <IonCard>
        <IonCardContent>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
            <div style={{ flexGrow: 1 }}>
              <h2 style={{ margin: 0 }}>Enable Multi-Factor Authentication</h2>
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
    {/* Recovery Codes Card (only shown if recovery codes exist) */}
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

    {/* Fixed TOTP Toggle Component */}
    {(selectedMFAMethod === 'totp' || showTotp) && (
      <TotpToggle 
        initialEnabled={true}
        onToggleChange={(enabled) => {
          if (!enabled) {
            // Optional: handle when TOTP is disabled from the child component
            setShowTotp(false);
            setSelectedMFAMethod(null);
          }
        }}
      />
    )}
  </>
)}
      {/* MFA Method Selection Action Sheet */}
      <IonActionSheet
        isOpen={showMFASelection}
        onDidDismiss={() => handleMFASelection('cancel')}
        header="Select MFA Method"
        buttons={[
          {
            text: 'TOTP (Authenticator App)',
            icon: timeOutline,
            handler: () => handleMFASelection('totp')
          },
          {
            text: 'Facial Recognition',
            icon: eyeOutline,
            handler: () => handleMFASelection('facial')
          },
          {
            text: 'Vocal Password',
            icon: micOutline,
            handler: () => handleMFASelection('vocal')
          },
          {
            text: 'Biometrics',
            icon: fingerPrintOutline,
            handler: () => handleMFASelection('biometrics')
          },
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => handleMFASelection('cancel')
          }
        ]}
      />

      {/* Disable MFA Confirmation Alert */}
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
        color={toastMessage.includes('success') ? 'success' : 'danger'}
      />
    </IonContent>
  );
};

export default EnableMFA;