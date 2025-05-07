import React from 'react';
import { IonIcon, IonRow, IonCol } from '@ionic/react';
import { linkOutline, imageOutline, documentAttachOutline } from 'ionicons/icons';

const Attachments: React.FC = () => {
  return (
    <IonRow style={{ justifyContent: 'flex-start', gap: '16px', padding: '8px' }}>
      <IonCol size="auto">
        <IonIcon
          icon={linkOutline}
          size="large"
          onClick={() => console.log('Attach Link')}
          style={{ cursor: 'pointer' }}
        />
      </IonCol>
      <IonCol size="auto">
        <IonIcon
          icon={imageOutline}
          size="large"
          onClick={() => console.log('Attach Image')}
          style={{ cursor: 'pointer' }}
        />
      </IonCol>
      <IonCol size="auto">
        <IonIcon
          icon={documentAttachOutline}
          size="large"
          onClick={() => console.log('Attach File')}
          style={{ cursor: 'pointer' }}
        />
      </IonCol>
    </IonRow>
  );
};

export default Attachments;
