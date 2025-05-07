import React, { useState } from 'react';
import { IonCard, IonCardContent, IonTextarea } from '@ionic/react';

const Journalized: React.FC = () => {
  const [entry, setEntry] = useState('');

  return (
    <IonCard style={{height:'400px'}}>
      <IonCardContent>
        <IonTextarea
          value={entry}
          placeholder="Journilzed here..."
          autoGrow
          rows={6}
          onIonChange={(e) => setEntry(e.detail.value!)}
        />
      </IonCardContent>
    </IonCard>
  );
};

export default Journalized;
