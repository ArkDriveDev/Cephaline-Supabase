import {
  IonActionSheet,
  IonLoading,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supaBaseClient';
import {
  personOutline,
  micOutline,
  keyOutline,
  timeOutline
} from 'ionicons/icons';

type MFAType = 'totp' | 'face' | 'voice' | 'recovery';

interface AlternativeMFAModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  userId: string;
  currentMethod: MFAType;
  onSelectOption: (option: Exclude<MFAType, 'totp'> | 'totp') => void;
}

const MfaActionSheet: React.FC<AlternativeMFAModalProps> = ({
  isOpen,
  onDidDismiss,
  userId,
  currentMethod,
  onSelectOption
}) => {
  const [availableOptions, setAvailableOptions] = useState<MFAType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailableOptions = async () => {
      try {
        setLoading(true);

        const [
          { data: faceData },
          { data: voiceData },
          { count: recoveryCount },
          { data: totpData }
        ] = await Promise.all([
          supabase.from('user_facial_enrollments').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('user_voice_passwords').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('recovery_codes').select('*', { count: 'exact', head: true })
            .eq('user_id', userId).eq('code_status', 'active'),
          supabase.from('user_totp').select('id').eq('user_id', userId).maybeSingle()
        ]);

        const options: MFAType[] = [];
        if (faceData?.id) options.push('face');
        if (voiceData?.id) options.push('voice');
        if ((recoveryCount || 0) > 0) options.push('recovery');
        if (totpData?.id) options.push('totp');

        const filtered = options.filter((opt) => opt !== currentMethod);
        setAvailableOptions(filtered);
      } catch (error) {
        console.error('Failed to check MFA options:', error);
        setAvailableOptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && userId) {
      checkAvailableOptions();
    }
  }, [isOpen, userId, currentMethod]);

  const methodLabels: Record<MFAType, { text: string, icon: string }> = {
    totp: { text: 'Authenticator App', icon: timeOutline },
    face: { text: 'Face Recognition', icon: personOutline },
    voice: { text: 'Voice Authentication', icon: micOutline },
    recovery: { text: 'Recovery Code', icon: keyOutline }
  };

  return (
    <>
      <IonLoading isOpen={loading} message="Checking available methods..." />
      <IonActionSheet
        isOpen={isOpen && !loading}
        onDidDismiss={onDidDismiss}
        header="Choose another authentication method"
        buttons={[
          ...availableOptions.map((method) => ({
            text: methodLabels[method].text,
            icon: methodLabels[method].icon,
            handler: () => onSelectOption(method)
          })),
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default MfaActionSheet;
