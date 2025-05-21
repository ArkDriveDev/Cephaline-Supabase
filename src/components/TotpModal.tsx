import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';

interface TotpModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const TotpModal: React.FC<TotpModalProps> = ({ isOpen, onDidDismiss }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>TOTP Verification</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="8">
              <IonInput
                type="text"
                label="Enter TOTP Code"
                labelPlacement="floating"
                fill="outline"
                placeholder="123456"
                inputMode="numeric"
                maxlength={6}
              />
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size="12" sizeMd="8">
              <IonButton expand="block">Verify</IonButton>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size="12" className="ion-text-center">
              <IonText color="primary">
                <p style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                  Use another way
                </p>
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default TotpModal;
