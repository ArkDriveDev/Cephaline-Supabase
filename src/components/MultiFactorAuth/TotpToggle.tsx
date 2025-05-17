import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonToggle,
  IonLabel,
  IonItem,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';

import { copyOutline, refreshOutline } from 'ionicons/icons';

interface TotpToggleProps {
    initialEnabled?: boolean;  // Make sure this is defined
  }

  const TotpToggle: React.FC<TotpToggleProps> = ({ initialEnabled = false }) => {
  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = (event: CustomEvent) => {
    setIsEnabled(event.detail.checked);
  };

  return (
      <IonContent className="ion-padding">

        {/* Toggle Switch */}
        <IonItem>
          <IonLabel>
            TOTP (Time-based One-Time Password)
          </IonLabel>
          <IonToggle
            checked={isEnabled}
            onIonChange={handleToggle}
          />
        </IonItem>

        {/* Regenerate Button */}
        <IonButton expand="block" fill="outline" className="ion-margin-top">
          <IonIcon slot="start" icon={refreshOutline} />
          Regenerate
        </IonButton>

        {/* TOTP Code Card */}
        <IonCard className="ion-margin-top">
          <IonCardContent>
            <IonGrid>
              <IonRow className="ion-align-items-center">
                <IonCol>
                  <h2 style={{ margin: 0 }}>123 456</h2>
                </IonCol>
                <IonCol size="auto">
                  <IonIcon icon={copyOutline} style={{ fontSize: '24px', cursor: 'pointer' }} />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

      </IonContent>
  );
};

export default TotpToggle;
