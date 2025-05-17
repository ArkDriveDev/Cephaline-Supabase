import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonToggle,
  IonLabel,
  IonAlert,
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
  IonActionSheet
} from '@ionic/react';
import { supabase } from '../../utils/supaBaseClient';
import { 
  copyOutline, 
  checkmarkDoneOutline, 
  closeOutline,
  fingerPrintOutline,
  eyeOutline,
  micOutline,
  lockClosedOutline,
  timeOutline
} from 'ionicons/icons';
import { useCopyToClipboard } from 'react-use';

const EnableMFA: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<{code_hash: string, code_status: string}[]>([]);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showMFASelection, setShowMFASelection] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();

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
    setPendingToggle(enabled);

    if (enabled) {
      // Show MFA selection when enabling
      setShowMFASelection(true);
    } else {
      // Disable MFA immediately
      await toggleMFA(false);
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
        setIsEnabled(true);
      } else {
        await deleteAllRecoveryCodes(user.id);
        setRecoveryCodes([]);
        setToastMessage('MFA disabled successfully!');
        setIsEnabled(false);
      }
    } catch (error: any) {
      console.error('Error toggling MFA:', error);
      setToastMessage(error.message || 'Failed to update MFA settings');
    } finally {
      setShowToast(true);
      setPendingToggle(false);
    }
  };

  const handleMFASelection = (method: string) => {
    setShowMFASelection(false);
    
    if (method === 'cancel') {
      // Don't toggle if cancelled
      setIsEnabled(false);
      return;
    }

    // Here you would implement the specific MFA method setup
    console.log(`Selected MFA method: ${method}`);
    
    // Proceed with enabling MFA
    toggleMFA(true);
  };

  const copyCodes = () => {
    const codesText = recoveryCodes.map(code => code.code_hash).join('\n');
    copyToClipboard(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {isEnabled && recoveryCodes.length > 0 && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Your Recovery Codes</IonCardTitle>
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
            icon: closeOutline,
            role: 'cancel',
            handler: () => handleMFASelection('cancel')
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