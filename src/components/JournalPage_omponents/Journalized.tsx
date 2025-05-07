import React, { useState } from 'react';
import { IonCard, IonCardContent, IonTextarea } from '@ionic/react';

interface Attachment {
  type: string;
  content: string;
}

const Journalized: React.FC<{ attachments: Attachment[] }> = ({ attachments }) => {
  const [entry, setEntry] = useState('');

  return (
    <IonCard style={{height:'400px'}}>
      <IonCardContent>
        <IonTextarea
          value={entry}
          placeholder="Journalize here..."
          autoGrow
          rows={6}
          onIonChange={(e) => setEntry(e.detail.value!)}
        />
        <div style={{ marginTop: '10px' }}>
          {attachments.map((attachment, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {attachment.type === 'link' && (
                <a href={attachment.content} target="_blank" rel="noopener noreferrer">
                  {attachment.content}
                </a>
              )}
            </div>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default Journalized;