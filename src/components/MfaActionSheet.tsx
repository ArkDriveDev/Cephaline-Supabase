import {
  IonActionSheet,
} from '@ionic/react';
import {
  personOutline,
  micOutline,
  keyOutline,
  timeOutline
} from 'ionicons/icons';

type MFAType = 'totp' | 'face' | 'voice' | 'recovery';

interface MfaActionSheetProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  currentMethod: MFAType | null;
  availableMethods: {
    totp: boolean;
    face: boolean;
    voice: boolean;
    recovery: boolean;
  };
  onSelectOption: (option: MFAType) => void;
}

const MfaActionSheet: React.FC<MfaActionSheetProps> = ({
  isOpen,
  onDidDismiss,
  currentMethod,
  availableMethods,
  onSelectOption
}) => {
  const methodLabels: Record<MFAType, { text: string, icon: string }> = {
    totp: { text: 'Authenticator App', icon: timeOutline },
    face: { text: 'Face Recognition', icon: personOutline },
    voice: { text: 'Voice Authentication', icon: micOutline },
    recovery: { text: 'Recovery Code', icon: keyOutline }
  };

  // Filter out the current method and only include available methods
  const availableOptions = (Object.entries(availableMethods) as [MFAType, boolean][])
    .filter(([method, isAvailable]) => isAvailable && method !== currentMethod)
    .map(([method]) => method);

  return (
    <IonActionSheet
      isOpen={isOpen}
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
          role: 'cancel',
          handler: onDidDismiss
        }
      ]}
    />
  );
};

export default MfaActionSheet;