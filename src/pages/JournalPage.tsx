import { 
    IonButtons,
      IonContent, 
      IonHeader, 
      IonMenuButton, 
      IonPage, 
      IonTitle, 
      IonToolbar 
  } from '@ionic/react';
import PageTitle from '../components/JournalPage_omponents/PageTitle';
  
  const JournalPage: React.FC = () => {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot='start'>
              <IonMenuButton></IonMenuButton>
            </IonButtons>
            <IonTitle>Journalized</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
            <PageTitle/>
        </IonContent>
      </IonPage>
    );
  };
  
  export default JournalPage;