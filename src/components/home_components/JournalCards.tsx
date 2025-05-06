import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle,IonPopover, IonContent} from '@ionic/react';

function JournalCards() {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle id="hover-trigger" color='secondary'>Programming 1</IonCardTitle>
            <IonPopover trigger="hover-trigger" triggerAction="hover">
        <IonContent class="ion-padding">Open Journal</IonContent>
</IonPopover>
        <IonCardSubtitle>Fundamentals of Programming</IonCardSubtitle>
      </IonCardHeader>

      <IonCardContent>Created at /07/23/2025</IonCardContent>
    </IonCard>
  );
}
export default JournalCards;