import React from 'react';
import { IonIcon, IonRow, IonCol, IonContent, IonPopover } from '@ionic/react';
import {
  linkOutline,
  imageOutline,
  documentAttachOutline,
  folderOpenOutline
} from 'ionicons/icons';

const Attachments: React.FC = () => {
  return (
    <IonRow style={{ justifyContent: 'flex-start', gap: '1px', padding: '8px' }}>
      <IonCol size="auto">
        <IonIcon
          id="hover-trigger1"
          icon={linkOutline}
          size="large"
          onClick={() => console.log('Attach Link')}
          style={{ cursor: 'pointer' }}
        />
        <IonPopover trigger="hover-trigger1" triggerAction="hover" side='top'>
          <IonContent class="ion-padding">Attach Link</IonContent>
        </IonPopover>
      </IonCol>
      <IonCol size="auto">
        <IonIcon
          id="hover-trigger2"
          icon={imageOutline}
          size="large"
          onClick={() => console.log('Attach Image')}
          style={{ cursor: 'pointer' }}
        />
        <IonPopover trigger="hover-trigger2" triggerAction="hover" side='top'>
          <IonContent class="ion-padding">Attach Image</IonContent>
        </IonPopover>
      </IonCol>
      <IonCol size="auto">
        <IonIcon
          id="hover-trigger3"
          icon={documentAttachOutline}
          size="large"
          onClick={() => console.log('Attach File')}
          style={{ cursor: 'pointer' }}
        />
        <IonPopover trigger="hover-trigger3" triggerAction="hover" side='top'>
          <IonContent class="ion-padding">Attach File</IonContent>
        </IonPopover>
      </IonCol>
      <IonCol size="auto">
        <IonIcon
          id="hover-trigger4"
          icon={folderOpenOutline}
          size="large"
          onClick={() => console.log('Attach Folder')}
          style={{ cursor: 'pointer' }}
        />
        <IonPopover trigger="hover-trigger4" triggerAction="hover" side='top'>
          <IonContent class="ion-padding">Attach Folder</IonContent>
        </IonPopover>
      </IonCol>
    </IonRow>
  );
};

export default Attachments;
