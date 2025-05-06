import React from 'react';
import { IonButton,IonIcon} from '@ionic/react';
import { bookOutline} from 'ionicons/icons';

function NewButton() {
  return (
    <>
      <IonButton>
      <IonIcon slot="start" icon={bookOutline}></IonIcon>
      New
      </IonButton>
    </>
  );
}
export default NewButton;