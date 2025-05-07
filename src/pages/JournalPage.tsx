import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  useIonToast
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import PageTitle from '../components/JournalPage_omponents/PageTitle';
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Journalized from '../components/JournalPage_omponents/Journalized';
import Attachments from '../components/JournalPage_omponents/Attachements';
import SavePage from '../components/JournalPage_omponents/SavePage';
import { supabase } from '../utils/supaBaseClient';

const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [entry, setEntry] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [isSaving, setIsSaving] = useState(false);
  const [present] = useIonToast();

  const handleSave = async () => {
    if (!journalId) {
      present({ message: 'No journal selected', duration: 2000, color: 'danger' });
      return;
    }

    if (!entry.trim()) {
      present({ message: 'Entry cannot be empty', duration: 2000, color: 'warning' });
      return;
    }

    if (!pageTitle.trim()) {
      present({ message: 'Page title cannot be empty', duration: 2000, color: 'warning' });
      return;
    }

    setIsSaving(true);

    try {
      const { data: pages, error: pageError } = await supabase
        .from('journal_pages')
        .select('page_no')
        .eq('journal_id', journalId)
        .order('page_no', { ascending: false })
        .limit(1);

      if (pageError) throw pageError;
      const nextPageNo = pages?.[0]?.page_no + 1 || 1;

      const { data: newPage, error: insertError } = await supabase
        .from('journal_pages')
        .insert({
          journal_id: journalId,
          page_title: pageTitle,
          mood,
          page_no: nextPageNo
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: contentError } = await supabase
        .from('journal_page_contents')
        .insert({
          page_id: newPage.page_id,
          content_order: 1,
          paragraph: entry
        });

      if (contentError) throw contentError;

      present({
        message: 'Journal page saved successfully!',
        duration: 2000,
        color: 'success'
      });

      setEntry('');
      setPageTitle('');
      setMood('Neutral');
    } catch (error) {
      console.error('Error saving journal page:', error);
      present({
        message: 'Failed to save journal page',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/cephaline-supabase/app/journals" />
          </IonButtons>
          <IonTitle>New Journal Page</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
      <p>Viewing journal entry{journalId}</p>

        <PageTitle onTitleChange={setPageTitle} />

        <h1 style={{ margin: '30px 0' }}>How are you feeling today?</h1>

        <Spectrum onMoodChange={setMood} currentMood={mood} />

        <Journalized entry={entry} onEntryChange={setEntry} />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px'
        }}>
          <Attachments onAttach={(att) => setEntry(prev => `${prev}\n[${att.type}] ${att.content}`)} />
          <SavePage
            onSave={handleSave}
            disabled={!entry.trim() || !pageTitle.trim() || isSaving}
            loading={isSaving}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;