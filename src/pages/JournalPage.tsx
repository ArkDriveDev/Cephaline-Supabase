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
import { useParams } from 'react-router-dom';

const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>(); // Remove "string" if you get type errors
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Journal {journalId}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <p>Viewing journal entry: {journalId}</p>
        <PageTitle/>
      </IonContent>
    </IonPage>
  );
};
  
  export default JournalPage;