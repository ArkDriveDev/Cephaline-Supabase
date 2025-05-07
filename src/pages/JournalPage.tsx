import React, { useState } from 'react';
import { useIonRouter } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import PageTitle from '../components/JournalPage_omponents/PageTitle';
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Journalized from '../components/JournalPage_omponents/Journalized';
import Attachments from '../components/JournalPage_omponents/Attachements';
import SavePage from '../components/JournalPage_omponents/SavePage';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [entry, setEntry] = useState<string>('');
  const [mood, setMood] = useState<string>('Neutral');
  const [isSaving, setIsSaving] = useState(false);
  const router = useIonRouter();

  const handleAttach = (attachment: { type: string; content: string }) => {
    const formatted = `\n${attachment.content}`;
    setEntry((prev) => prev + formatted);
  };

  const getNextPageNumber = async (journalId: string) => {
    const { data, error } = await supabase
      .from('journal_pages')
      .select('page_no')
      .eq('journal_id', journalId)
      .order('page_no', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching page numbers:', error);
      return 1;
    }

    return data.length > 0 ? data[0].page_no + 1 : 1;
  };

  const handleSave = async () => {
    if (!entry.trim()) return; // Don't save empty entries
    
    setIsSaving(true);
    try {
      const pageNo = await getNextPageNumber(journalId);

      // Create the journal page
      const { data: pageData, error: pageError } = await supabase
        .from('journal_pages')
        .insert({
          journal_id: journalId,
          page_title: `Entry ${pageNo}`,
          mood: mood,
          page_no: pageNo,
        })
        .select()
        .single();

      if (pageError) throw pageError;

      // Add the content
      const { error: contentError } = await supabase
        .from('journal_page_contents')
        .insert({
          page_id: pageData.page_id,
          content_order: 1,
          paragraph: entry,
        });

      if (contentError) throw contentError;

      return Promise.resolve();
    } catch (error) {
      console.error('Error saving journal:', error);
      return Promise.reject(error);
    } finally {
      setIsSaving(false);
    }
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
        <Spectrum onMoodChange={setMood} />
        <Journalized entry={entry} onEntryChange={setEntry} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1590px', marginTop: '-18px' }}>
          <Attachments onAttach={handleAttach} />
          <SavePage 
            onSave={handleSave} 
            disabled={!entry.trim() || isSaving} 
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;