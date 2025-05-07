import React from 'react';
import { IonCard, IonCardContent, IonTextarea } from '@ionic/react';

interface JournalizedProps {
  entry: string;
  onEntryChange: (text: string) => void;
}

const Journalized: React.FC<JournalizedProps> = ({ entry, onEntryChange }) => {
  return (
    <IonCard style={{height:'400px'}}>
      <IonCardContent>
        <IonTextarea
          value={entry}
          placeholder="Journalize here..."
          autoGrow
          rows={6}
          onIonChange={(e) => onEntryChange(e.detail.value!)}
          style={{ height: '100%' }}
        />
      </IonCardContent>
    </IonCard>
  );
};

export default Journalized;