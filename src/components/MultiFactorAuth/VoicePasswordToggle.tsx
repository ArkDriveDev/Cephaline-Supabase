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

  // Function to handle toggle change
  const handleToggleChange = (checked: boolean) => {
    setEnabled(checked);
  };

  // Function to render input and button
  const renderInputAndButton = () => {
    if (!enabled) return null;

    return (
      <>
        <IonItem>
          <IonInput label="Enter voice password" labelPlacement="floating" />
        </IonItem>
        <IonButton expand="block">Submit</IonButton>
      </>
    );
  };

  return (
    <IonList>
      <IonItem>
        <IonLabel>Voice password</IonLabel>
        <IonToggle
          slot="end"
          checked={enabled}
          onIonChange={(e) => handleToggleChange(e.detail.checked)}
        />
      </IonItem>

      {renderInputAndButton()}
    </IonList>
  );
};

export default VoicePasswordToggle;
