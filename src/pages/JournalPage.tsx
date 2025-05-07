import React, { useState } from 'react';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import PageTitle from '../components/JournalPage_omponents/PageTitle';
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Journalized from '../components/JournalPage_omponents/Journalized';
import Attachments from '../components/JournalPage_omponents/Attachements';
import SavePage from '../components/JournalPage_omponents/SavePage';

interface Attachment {
  type: string;
  content: string;
}

const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [entry, setEntry] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleAttach = (attachment: Attachment) => {
    let attachmentText = '';
    
    switch(attachment.type) {
      case 'link':
        attachmentText = `\n[Link: ${attachment.content}]\n`;
        break;
      case 'image':
        attachmentText = `\n[Image attached]\n`;
        break;
      case 'file':
        attachmentText = `\n[File: ${attachment.content}]\n`;
        break;
      case 'folder':
        attachmentText = `\n[Folder: ${attachment.content}]\n`;
        break;
      default:
        attachmentText = `\n[Attachment]\n`;
    }

    setEntry(prevEntry => prevEntry + attachmentText);
    setAttachments(prev => [...prev, attachment]);
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
      
      <IonContent className="ion-padding">
        <p>Viewing journal entry {journalId}</p>
        <PageTitle />
        <h1 style={{ margin: '30px 0' }}>How are you feeling about this journal?</h1>
        <Spectrum />
        <Journalized entry={entry} onEntryChange={setEntry} />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '20px'
        }}>
          <Attachments onAttach={handleAttach} />
          <SavePage />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;