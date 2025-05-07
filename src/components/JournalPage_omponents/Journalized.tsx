import React, { useState } from 'react';
import { IonCard, IonCardContent, IonTextarea, IonButton } from '@ionic/react';

interface Props {
  onAddParagraph: (text: string) => void;
}

const Journalized: React.FC<Props> = ({ onAddParagraph }) => {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (text.trim()) {
      onAddParagraph(text.trim());
      setText('');
    }
  };

  return (
    <IonCard>
      <IonCardContent>
        <IonTextarea
          value={text}
          placeholder="Journalize here..."
          autoGrow
          rows={6}
          onIonChange={(e) => setText(e.detail.value!)}
        />
        <IonButton expand="block" onClick={handleAdd} style={{ marginTop: '10px' }}>
          Add Entry
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default Journalized;
