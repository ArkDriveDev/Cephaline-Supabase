import React from 'react';
import { IonCard, IonCardContent, IonTextarea } from '@ionic/react';

interface JournalizedProps {
  markdownContent: string;
  onContentChange: (markdown: string) => void;
}

const Journalized: React.FC<JournalizedProps> = ({ markdownContent, onContentChange }) => {
  return (
    <IonCard style={{ height: '400px', margin: '0 0 20px 0' }}>
      <IonCardContent style={{ height: '100%', padding: '0' }}>
        <IonTextarea
          value={markdownContent}
          placeholder="Write your journal entry (supports Markdown formatting)..."
          autoGrow
          rows={6}
          onIonChange={(e) => onContentChange(e.detail.value!)}
          style={{ 
            height: '100%',
            fontSize: '14px',
            padding: '10px'
          }}
        />
      </IonCardContent>
    </IonCard>
  );
};

export default Journalized;