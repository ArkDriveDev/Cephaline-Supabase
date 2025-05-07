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
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Journalized from '../components/JournalPage_omponents/Journalized';

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
        <p>Viewing journal entry{journalId}</p>
        <PageTitle/>
        <h1  style={{margin:'30px',marginTop:'80px'}}>How are you feeling for these Journal?</h1>
        <Spectrum/>
        <Journalized/>
      </IonContent>
    </IonPage>
  );
};
  
  export default JournalPage;