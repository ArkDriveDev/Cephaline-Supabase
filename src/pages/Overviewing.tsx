import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import OverViewcard from '../components/OverView_com/OverViewcard';
import OverviewSideCard from '../components/OverView_com/OverviewsideCard';

const Overviewing: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  
  console.log('Overviewing component received journalId from route params:', journalId); // Debug log

  if (!journalId) {
    console.error('No journalId in route params'); // Error log
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Error: No Journal Selected</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <p>Please select a journal from the main page.</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Journal Overview</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="overview-container">
          <OverViewcard journalId={journalId} />
          <OverviewSideCard journalId={journalId} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Overviewing;