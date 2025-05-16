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
  IonLabel
} from '@ionic/react';

const EnableMFA: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = (e: CustomEvent) => {
    setIsEnabled(e.detail.checked);
    console.log('MFA Enabled:', e.detail.checked);
  };

  return (
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-align-items-center">
            <IonCol size="auto">
              <IonLabel>Enable Multifactor Authentication</IonLabel>
            </IonCol>
            <IonCol size="auto">
              <IonToggle
                checked={isEnabled}
                onIonChange={handleToggle}
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
  );
};

export default EnableMFA;
