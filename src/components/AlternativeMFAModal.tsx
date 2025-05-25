import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonAvatar,
  IonInput,
  IonAlert,
  IonSpinner,
} from '@ionic/react';
import { close, personOutline, micOutline, keyOutline, timeOutline } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';

type MFAType = 'totp' | 'face' | 'voice' | 'recovery';

interface AlternativeMFAModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  userId: string;
  currentMethod: MFAType;
  onSelectOption: (option: MFAType) => void; // Changed to allow all MFAType values
  onRecoveryCodeSuccess: () => void;
}

const AlternativeMFAModal: React.FC<AlternativeMFAModalProps> = ({
  isOpen,
  onDidDismiss,
  userId,
  currentMethod,
  onSelectOption,
  onRecoveryCodeSuccess,
}) => {
  const [availableOptions, setAvailableOptions] = useState<{
    face: boolean;
    voice: boolean;
    recovery: boolean;
    totp: boolean;
  }>({ face: false, voice: false, recovery: false, totp: false });
  const [loading, setLoading] = useState(true);
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const checkAvailableOptions = async () => {
      try {
        setLoading(true);
        
        const [
          { data: faceData },
          { data: voiceData },
          { count: recoveryCount },
          { data: totpData },
        ] = await Promise.all([
          supabase.from('user_facial_enrollments').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('user_voice_passwords').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('recovery_codes').select('*', { count: 'exact', head: true })
            .eq('user_id', userId).eq('code_status', 'active'),
          supabase.from('user_totp').select('id').eq('user_id', userId).maybeSingle(),
        ]);

        setAvailableOptions({
          face: !!faceData?.id,
          voice: !!voiceData?.id,
          recovery: (recoveryCount || 0) > 0,
          totp: !!totpData?.id,
        });
      } catch (error) {
        console.error('Error checking MFA options:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && userId) {
      checkAvailableOptions();
    }
  }, [isOpen, userId]);

  const handleDismiss = () => {
    setShowRecoveryInput(false);
    setRecoveryCode('');
    setError('');
    onDidDismiss();
  };

  const verifyRecoveryCode = async () => {
    if (!recoveryCode.trim()) {
      setError('Please enter a recovery code');
      setShowErrorAlert(true);
      return;
    }

    try {
      setIsVerifying(true);
      const codeHash = await hashRecoveryCode(recoveryCode);

      const { data, error: findError } = await supabase
        .from('recovery_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code_hash', codeHash)
        .eq('code_status', 'active')
        .maybeSingle();

      if (findError || !data) {
        throw new Error('Invalid or expired recovery code');
      }

      const { error: updateError } = await supabase
        .from('recovery_codes')
        .update({ 
          code_status: 'used',
          used_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('code_hash', codeHash);

      if (updateError) throw updateError;

      onRecoveryCodeSuccess();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setShowErrorAlert(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const hashRecoveryCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const filteredOptions = {
    face: availableOptions.face && currentMethod !== 'face',
    voice: availableOptions.voice && currentMethod !== 'voice',
    recovery: availableOptions.recovery && currentMethod !== 'recovery',
    totp: availableOptions.totp && currentMethod !== 'totp',
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {showRecoveryInput ? 'Use Recovery Code' : 'Other Verification Methods'}
          </IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleDismiss}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {showRecoveryInput ? (
          <>
            <IonText>
              <p className="ion-text-center">
                Enter one of your recovery codes. Each code can only be used once.
              </p>
            </IonText>

            <div style={{ margin: '2rem 0' }}>
              <IonInput
                value={recoveryCode}
                onIonChange={(e) => setRecoveryCode(e.detail.value!)}
                placeholder="Enter recovery code"
                clearInput
                autofocus
                style={{
                  border: '1px solid var(--ion-color-medium)',
                  borderRadius: '8px',
                  padding: '10px',
                }}
              />
            </div>

            <IonButton
              expand="block"
              onClick={verifyRecoveryCode}
              disabled={isVerifying}
            >
              {isVerifying ? <IonSpinner name="crescent" /> : 'Verify Recovery Code'}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              onClick={() => setShowRecoveryInput(false)}
            >
              Back to options
            </IonButton>
          </>
        ) : (
          <>
            <IonText>
              <h2 className="ion-text-center" style={{ marginBottom: '2rem' }}>
                Choose another way to verify
              </h2>
            </IonText>

            {loading ? (
              <div className="ion-text-center" style={{ marginTop: '2rem' }}>
                <IonSpinner name="dots" />
                <p>Loading available options...</p>
              </div>
            ) : (
              <IonList lines="full">
                {filteredOptions.totp && (
                  <IonItem button onClick={() => onSelectOption('totp')}>
                    <IonAvatar slot="start">
                      <IonIcon icon={timeOutline} size="large" />
                    </IonAvatar>
                    <IonLabel>
                      <h2>Authenticator App</h2>
                      <p>Use your 6-digit code</p>
                    </IonLabel>
                  </IonItem>
                )}

                {filteredOptions.face && (
                  <IonItem button onClick={() => onSelectOption('face')}>
                    <IonAvatar slot="start">
                      <IonIcon icon={personOutline} size="large" />
                    </IonAvatar>
                    <IonLabel>
                      <h2>Face Recognition</h2>
                      <p>Verify with your face</p>
                    </IonLabel>
                  </IonItem>
                )}

                {filteredOptions.voice && (
                  <IonItem button onClick={() => onSelectOption('voice')}>
                    <IonAvatar slot="start">
                      <IonIcon icon={micOutline} size="large" />
                    </IonAvatar>
                    <IonLabel>
                      <h2>Voice Authentication</h2>
                      <p>Verify with your voice</p>
                    </IonLabel>
                  </IonItem>
                )}

                {filteredOptions.recovery && (
                  <IonItem button onClick={() => setShowRecoveryInput(true)}>
                    <IonAvatar slot="start">
                      <IonIcon icon={keyOutline} size="large" />
                    </IonAvatar>
                    <IonLabel>
                      <h2>Recovery Codes</h2>
                      <p>Use a one-time recovery code</p>
                    </IonLabel>
                  </IonItem>
                )}

                {!filteredOptions.totp && !filteredOptions.face && 
                 !filteredOptions.voice && !filteredOptions.recovery && (
                  <IonText color="medium">
                    <p className="ion-text-center">No alternative verification methods available</p>
                  </IonText>
                )}
              </IonList>
            )}
          </>
        )}

        <IonAlert
          isOpen={showErrorAlert}
          onDidDismiss={() => setShowErrorAlert(false)}
          header="Verification Error"
          message={error}
          buttons={['OK']}
        />
      </IonContent>
    </IonModal>
  );
};

export default AlternativeMFAModal;