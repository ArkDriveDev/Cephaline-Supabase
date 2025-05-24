import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonButton,
  IonFooter,
} from '@ionic/react';

interface VoiceAuthModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const VoiceAuthModal: React.FC<VoiceAuthModalProps> = ({
  isOpen,
  onDidDismiss,
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Voice Authentication</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonText>
          <p>Please initiate your voice password authentication.</p>
        </IonText>

        <IonButton expand="block" className="ion-margin-top">
          Initiate Voice Password
        </IonButton>

        <IonButton
          expand="block"
          fill="clear"
          color="medium"
          className="ion-margin-top"
        >
          Try Another Way
        </IonButton>
      </IonContent>

      <IonFooter>
        <IonButton expand="block" color="danger" onClick={onDidDismiss}>
          Close
        </IonButton>
      </IonFooter>
    </IonModal>
  );
};

export default VoiceAuthModal;
