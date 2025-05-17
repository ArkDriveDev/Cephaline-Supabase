import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonToggle,
  IonLabel,
  IonItem
} from '@ionic/react';

const TotpToggle: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = (event: CustomEvent) => {
    setIsEnabled(event.detail.checked);
  };

  return (
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel>
            TOTP (Time-based One-Time Password)
          </IonLabel>
          <IonToggle
            checked={isEnabled}
            onIonChange={handleToggle}
          />
        </IonItem>
        <p>Status: <strong>{isEnabled ? 'Enabled' : 'Disabled'}</strong></p>
      </IonContent>
  );
};

export default TotpToggle;
