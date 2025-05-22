// FaceRecognitionModal.tsx
import React, { useRef } from 'react';
import {
  IonModal,
  IonButton,
  IonIcon,
  IonText,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { cameraOutline } from 'ionicons/icons';

interface FaceRecognitionModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
}

const FaceRecognitionModal: React.FC<FaceRecognitionModalProps> = ({ isOpen, onDidDismiss }) => {
  const modal = useRef<HTMLIonModalElement>(null);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss} ref={modal}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Face Recognition</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard className="ion-text-center">
          <IonCardContent>
            <IonGrid>
              <IonRow className="ion-justify-content-center ion-padding">
                <IonCol size="12">
                  <IonButton expand="block" color="primary">
                    <IonIcon icon={cameraOutline} slot="start" />
                    Open Camera
                  </IonButton>
                </IonCol>
                <IonCol size="12" className="ion-text-center">
                  <IonText color="medium">
                    <p style={{ cursor: 'pointer', marginTop: '1rem' }}>
                      <strong>Try another way</strong>
                    </p>
                  </IonText>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default FaceRecognitionModal;
