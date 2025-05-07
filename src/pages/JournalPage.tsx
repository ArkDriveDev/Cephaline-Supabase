import React, { useState } from 'react';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import PageTitle from '../components/JournalPage_omponents/PageTitle';
import { useParams } from 'react-router-dom';
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Journalized from '../components/JournalPage_omponents/Journalized';
import Attachments from '../components/JournalPage_omponents/Attachements';
import SavePage from '../components/JournalPage_omponents/SavePage';

const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [entry, setEntry] = useState<string>(''); // Manage journal entry text

  // Handle attachment (link, image, file)
  const handleAttach = (attachment: { type: string; content: string }) => {
    const formatted = `\n${attachment.content}`; // Add as markdown-style text
    setEntry((prev) => prev + formatted); // Append the attachment content to the journal entry
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Journal {journalId}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <p>Viewing journal entry {journalId}</p>
        <PageTitle />
        <h1 style={{ margin: '30px', marginTop: '80px' }}>How are you feeling for this Journal?</h1>
        <Spectrum />
        {/* Pass entry and setEntry to Journalized */}
        <Journalized entry={entry} onEntryChange={setEntry} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1590px', marginTop: '-18px' }}>
          {/* Pass handleAttach to Attachments */}
          <Attachments onAttach={handleAttach} />
          <SavePage />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;
