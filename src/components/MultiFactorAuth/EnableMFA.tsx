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
  IonAlert,
  IonSpinner
} from '@ionic/react';
import { supabase } from '../../utils/supaBaseClient';
import {
  copyOutline,
  checkmarkDoneOutline,
  refreshOutline
} from 'ionicons/icons';
import { useCopyToClipboard } from 'react-use';
import TotpToggle from './TotpToggle';
import FacialRecognitionToggle from './FacialRecognitionToggle';
import VoicePasswordToggle from './VoicePasswordToggle';

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
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeMFAMethod, setActiveMFAMethod] = useState<'totp' | 'facial' | 'voice' | null>(null);

  // Check MFA status on load
useEffect(() => {
  const checkMFAStatus = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setLoadingUser(false);
      return;
    }

    setUser(user);

    // Parallel queries (no individual try-catch since tables are confirmed to exist)
    const [
      { data: recoveryCodes },
      { data: totp },
      { data: facialEnrollment },
      { data: voicePassword },
      { data: facialFiles }
    ] = await Promise.all([
      supabase.from('recovery_codes')
        .select('code_hash, code_status')
        .eq('user_id', user.id),
      
      supabase.from('user_totp')
        .select('is_verified')
        .eq('user_id', user.id)
        .single(),
      
      supabase.from('user_facial_enrollments')
        .select('is_active, storage_path')
        .eq('user_id', user.id)
        .single(),
      
      supabase.from('user_voice_passwords')
        .select('password')
        .eq('user_id', user.id)
        .single(),
      
      supabase.storage.from('facial-recognition')
        .list(`${user.id}/`)
    ]);

    // Determine MFA status
    const hasTOTP = totp?.is_verified ?? false;
    const hasFacial = (facialEnrollment?.is_active && facialFiles?.some(f => f.name === 'profile.jpg')) ?? false;
    const hasVoice = !!voicePassword?.password;
    const hasActiveRecoveryCodes = (recoveryCodes?.some(c => c.code_status === 'active')) ?? false;

    setRecoveryCodes(recoveryCodes || []);
    setIsEnabled(hasTOTP || hasFacial || hasVoice || hasActiveRecoveryCodes);

    setActiveMFAMethod(
      hasTOTP ? 'totp' :
      hasFacial ? 'facial' :
      hasVoice ? 'voice' :
      null
    );
    
    setLoadingUser(false);
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
      // When enabling, generate recovery codes if none exist
      if (recoveryCodes.length === 0) {
        try {
          setPendingToggle(true);
          const codes = await generateRecoveryCodes(user?.id || '');
          setRecoveryCodes(codes);
          setIsEnabled(true);
          setToastMessage('MFA enabled with recovery codes!');
          setShowToast(true);
        } catch (error) {
          setToastMessage('Failed to enable MFA');
          setShowToast(true);
        } finally {
          setPendingToggle(false);
        }
      } else {
        setIsEnabled(true);
      }
    } else {
      setShowDisableConfirm(true);
    }
  };

  const confirmDisableMFA = async (confirm: boolean) => {
    setShowDisableConfirm(false);
    if (!confirm || !user) return;

    setPendingToggle(true);
    try {
      // Delete all recovery codes (both active and used)
      await deleteAllRecoveryCodes(user.id);

      // Delete TOTP codes
      const { error: totpError } = await supabase
        .from('user_totp')
        .delete()
        .eq('user_id', user.id);

      if (totpError) throw totpError;

      // Delete facial recognition data
      const { error: facialEnrollmentError } = await supabase
        .from('user_facial_enrollments')
        .delete()
        .eq('user_id', user.id);

      if (facialEnrollmentError) throw facialEnrollmentError;

      // Delete facial recognition files
      try {
        const { data: files } = await supabase.storage
          .from('facial-recognition')
          .list(user.id);

        if (files && files.length > 0) {
          const filePaths = files.map(file => `${user.id}/${file.name}`);
          await supabase.storage
            .from('facial-recognition')
            .remove(filePaths);
        }
      } catch (storageError) {
        console.error('Facial storage cleanup error:', storageError);
      }

      // Delete voice password
      const { error: voicePasswordError } = await supabase
        .from('user_voice_passwords')
        .delete()
        .eq('user_id', user.id);

      if (voicePasswordError) throw voicePasswordError;

      // Update state
      setRecoveryCodes([]);
      setIsEnabled(false);
      setActiveMFAMethod(null);
      setToastMessage('All MFA methods disabled successfully!');
      setShowToast(true);

    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      setToastMessage(error.message || 'Failed to completely disable MFA');
      setShowToast(true);
    } finally {
      setPendingToggle(false);
    }
  };
  // Handle TOTP toggle changes
  const handleTotpToggleChange = async (enabled: boolean) => {
    if (enabled) {
      setActiveMFAMethod('totp');
      setIsEnabled(true);
      // Generate recovery codes if none exist
      if (recoveryCodes.length === 0) {
        try {
          const codes = await generateRecoveryCodes(user?.id || '');
          setRecoveryCodes(codes);
        } catch (error) {
          setToastMessage('Failed to generate recovery codes');
          setShowToast(true);
        }
      }
    } else {
      // Only update the active method, don't affect main MFA state
      if (activeMFAMethod === 'totp') {
        setActiveMFAMethod(null);
      }
    }
  };

  // Handle Facial Recognition toggle changes
  const handleFacialToggleChange = async (enabled: boolean) => {
    if (enabled) {
      setActiveMFAMethod('facial');
      setIsEnabled(true);
      // Generate recovery codes if none exist
      if (recoveryCodes.length === 0) {
        try {
          const codes = await generateRecoveryCodes(user?.id || '');
          setRecoveryCodes(codes);
        } catch (error) {
          setToastMessage('Failed to generate recovery codes');
          setShowToast(true);
        }
      }
    } else {
      // Only update the active method, don't affect main MFA state
      if (activeMFAMethod === 'facial') {
        setActiveMFAMethod(null);
      }
    }
  };

  // Handle Voice Password toggle changes
  const handleVoiceToggleChange = async (enabled: boolean) => {
    if (enabled) {
      setActiveMFAMethod('voice');
      setIsEnabled(true);
      // Generate recovery codes if none exist
      if (recoveryCodes.length === 0) {
        try {
          const codes = await generateRecoveryCodes(user?.id || '');
          setRecoveryCodes(codes);
        } catch (error) {
          setToastMessage('Failed to generate recovery codes');
          setShowToast(true);
        }
      }
    } else {
      // Only update the active method, don't affect main MFA state
      if (activeMFAMethod === 'voice') {
        setActiveMFAMethod(null);
      }
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
                <IonText color="medium">
                  <p>Save these codes in a secure place. Active codes can be used once.</p>
                </IonText>
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
                <IonList lines="full" className="ion-margin-vertical">
                  {recoveryCodes.map((code, index) => (
                    <IonItem key={index}>
                      <IonLabel>
                        <h3 style={{ color: code.code_status === 'active' ? 'inherit' : '#999' }}>
                          {code.code_hash}
                          {code.code_status === 'used' && (
                            <span style={{ marginLeft: '8px', fontSize: '0.8em', color: '#f00' }}>
                              (Used)
                            </span>
                          )}
                        </h3>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '10px' }}>
            <TotpToggle
              userId={user?.id || ''}
              initialEnabled={activeMFAMethod === 'totp'}
              onToggleChange={handleTotpToggleChange}
              disabled={false}
            />


            <VoicePasswordToggle
              initialEnabled={activeMFAMethod === 'voice'}
              onToggleChange={handleVoiceToggleChange}
              disabled={false}
            />

            <h1>................</h1>
          </div>
        </>
      )}

      <IonAlert
        isOpen={showDisableConfirm}
        onDidDismiss={() => setShowDisableConfirm(false)}
        header="Disable MFA?"
        message="Are you sure you want to disable Multi-Factor Authentication? This will make your account less secure."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel'
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