import React, { useState } from 'react';
import { IonContent, IonItem, IonLabel, IonToggle, IonText } from '@ionic/react';

const FacialRecognitionToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <IonContent className="ion-padding">
      <IonItem>
        <IonLabel>Facial Recognition</IonLabel>
        <IonToggle
          checked={enabled}
          onIonChange={(e) => setEnabled(e.detail.checked)}
        />
      </IonItem>

      <IonText color={enabled ? 'success' : 'medium'}>
        <p>
          {enabled
            ? 'Facial recognition is enabled.'
            : 'Facial recognition is disabled.'}
        </p>
      </IonText>
    </IonContent>
  );
};

export default FacialRecognitionToggle;
