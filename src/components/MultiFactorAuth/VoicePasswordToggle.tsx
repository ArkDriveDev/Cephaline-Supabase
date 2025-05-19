import React from 'react';
import { IonItem, IonLabel, IonToggle } from '@ionic/react';

const VoicePasswordToggle: React.FC = () => {
  return (
    <IonItem>
      <IonLabel>Voice password</IonLabel>
      <IonToggle slot="end" />
    </IonItem>
  );
};

export default VoicePasswordToggle;
