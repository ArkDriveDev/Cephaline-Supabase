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
import Attachments from '../components/JournalPage_omponents/Attachements';
import SavePage from '../components/JournalPage_omponents/SavePage';
import { useState } from 'react';

interface Attachment {
  type: string;
  content: string;
}

const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleAttach = (attachment: Attachment) => {
    setAttachments([...attachments, attachment]);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Journal {journalId}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <p>Viewing journal entry {journalId}</p>
        <PageTitle />
        <h1 style={{ margin: '30px', marginTop: '80px' }}>How are you feeling for these Journal?</h1>
        <Spectrum />
        <Journalized attachments={attachments} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1590px', marginTop: '-18px' }}>
          <Attachments onAttach={handleAttach} />
          <SavePage />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;