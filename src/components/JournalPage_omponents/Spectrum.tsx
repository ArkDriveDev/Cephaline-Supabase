import React, { useState } from 'react';
import { IonRange, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { happy, sad } from 'ionicons/icons';

const Spectrum: React.FC = () => {
  const [mood, setMood] = useState(50); // 0 = sad, 100 = happy

  return (
    <IonItem lines="none" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
      <IonLabel>Mood Spectrum</IonLabel>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <IonIcon icon={sad} slot="start" />
        <IonRange
          min={0}
          max={100}
          value={mood}
          onIonChange={(e) => setMood(e.detail.value as number)}
          style={{ flex: 1, margin: '0 12px' }}
        />
        <IonIcon icon={happy} slot="end" />
      </div>
      <IonLabel style={{ fontSize: '14px', marginTop: '6px' }}>
        Mood Level: {mood}
      </IonLabel>
    </IonItem>
  );
};

export default Spectrum;
