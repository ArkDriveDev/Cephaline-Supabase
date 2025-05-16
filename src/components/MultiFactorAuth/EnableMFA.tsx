import React, { useState } from 'react';
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
  IonIcon
} from '@ionic/react';
import { supabase } from '../../utils/supaBaseClient';
import { copyOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { useCopyToClipboard } from 'react-use';

const EnableMFA: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, copyToClipboard] = useCopyToClipboard();

  const generateRecoveryCodes = async (userId: string) => {
    // Generate 5 random 8-digit codes
    const codes = Array.from({ length: 5 }, () => 
      Math.floor(10000000 + Math.random() * 90000000).toString()
    );

    // Hash codes before storing (using Supabase's built-in auth functions)
    const { data, error } = await supabase.rpc('generate_recovery_codes', {
      user_id: userId,
      codes: codes
    });

    if (error) {
      console.error('Error saving recovery codes:', error);
      throw error;
    }

    return codes;
  };

  const handleToggle = async (e: CustomEvent) => {
    const enabled = e.detail.checked;
    
    try {
      if (enabled) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('No authenticated user');
        
        // Generate and store recovery codes
        const codes = await generateRecoveryCodes(user.id);
        setRecoveryCodes(codes);
        setShowCodes(true);
      }
      
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error toggling MFA:', error);
      setIsEnabled(!enabled); // Revert toggle on error
    }
  };

  const copyCodes = () => {
    copyToClipboard(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-align-items-center">
            <IonCol size="auto">
              <IonLabel>Enable MFA</IonLabel>
            </IonCol>
            <IonCol size="auto">
              <IonToggle
                checked={isEnabled}
                onIonChange={handleToggle}
              />
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonAlert
          isOpen={showCodes}
          onDidDismiss={() => setShowCodes(false)}
          header="Recovery Codes"
          message="Save these codes in a secure place. Each code can be used only once."
          buttons={[
            {
              text: 'I Have Saved These',
              handler: () => setShowCodes(false)
            }
          ]}
        >
          <div className="ion-padding">
            <IonList>
              {recoveryCodes.map((code, index) => (
                <IonItem key={index}>
                  <IonText>{code}</IonText>
                </IonItem>
              ))}
            </IonList>
            <IonButton expand="block" onClick={copyCodes}>
              <IonIcon slot="start" icon={copied ? checkmarkDoneOutline : copyOutline} />
              {copied ? 'Copied!' : 'Copy All Codes'}
            </IonButton>
          </div>
        </IonAlert>
      </IonContent>
  );
};

export default EnableMFA;