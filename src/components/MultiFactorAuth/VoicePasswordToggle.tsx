import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonInput,
  IonButton,
  IonList,
} from '@ionic/react';

const VoicePasswordToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <IonList>
      <IonItem>
        <IonLabel>Voice password</IonLabel>
        <IonToggle
          slot="end"
          checked={enabled}
          onIonChange={(e) => setEnabled(e.detail.checked)}
        />
      </IonItem>

      {enabled && (
        <>
          <IonItem>
            <IonInput label="Enter voice password" labelPlacement="floating" />
          </IonItem>
          <IonButton expand="block">Submit</IonButton>
        </>
      )}
    </IonList>
  );
};

export default VoicePasswordToggle;
