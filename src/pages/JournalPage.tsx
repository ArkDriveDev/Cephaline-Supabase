import React, { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonBackButton,
  IonButtons,
  useIonToast,
  useIonRouter
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Journalized from '../components/JournalPage_omponents/Journalized';
import Attachments from '../components/JournalPage_omponents/Attachements';
import SavePage from '../components/JournalPage_omponents/SavePage';
import PageTitle from '../components/JournalPage_omponents/PageTitle';

interface Attachment {
  type: string;
  content: string;
}

const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [entry, setEntry] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [mood, setMood] = useState('Neutral'); // Default to match Spectrum's initial state
  const [isSaving, setIsSaving] = useState(false);
  const [present] = useIonToast();
  const router = useIonRouter();

  // Verify journal exists on component mount
  useEffect(() => {
    const verifyJournal = async () => {
      if (!journalId) return;
      
      try {
        const { data, error } = await supabase
          .from('journals')
          .select('journal_id')
          .eq('journal_id', journalId)
          .single();

        if (error || !data) {
          present({ message: 'Journal not found', duration: 3000, color: 'danger' });
          router.push('/cephaline-supabase/app/home');
        }
      } catch (error) {
        console.error('Journal verification error:', error);
      }
    };

    verifyJournal();
  }, [journalId, present, router]);

  const getNextPageNumber = async (): Promise<number> => {
    if (!journalId) return 1;

    try {
      const { data, error } = await supabase
        .from('journal_pages')
        .select('page_no')
        .eq('journal_id', journalId)
        .order('page_no', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0]?.page_no + 1 || 1;
    } catch (error) {
      console.error('Error getting page number:', error);
      return 1;
    }
  };

  const handleAttachment = (att: Attachment) => {
    setEntry(prev => `${prev}\n[${att.type}] ${att.content}`);
  };

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
      const pageNo = await getNextPageNumber();

      // Insert journal page
      const { data: page, error: pageError } = await supabase
        .from('journal_pages')
        .insert({
          journal_id: journalId,
          page_title: pageTitle,
          mood,
          page_no: pageNo
        })
        .select()
        .single();

      if (pageError) throw pageError;

      // Insert content
      const { error: contentError } = await supabase
        .from('journal_page_contents')
        .insert({
          page_id: page.page_id,
          content_order: 1,
          paragraph: entry
        });

      if (contentError) {
        // Rollback page if content fails
        await supabase.from('journal_pages').delete().eq('page_id', page.page_id);
        throw contentError;
      }

      present({ message: 'Saved successfully!', duration: 2000, color: 'success' });
      router.push(`/cephaline-supabase/app/journals/${journalId}`);
    } catch (error) {
      console.error('Save failed:', error);
      present({ 
        message: 'Failed to save journal', 
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
            <IonBackButton defaultHref={`/cephaline-supabase/app/journals/${journalId}`} />
          </IonButtons>
          <IonTitle>{pageTitle || 'New Journal Entry'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <PageTitle onTitleChange={setPageTitle} />
        
        {/* Updated Spectrum integration */}
        <Spectrum onMoodChange={setMood} />
        
        <Journalized entry={entry} onEntryChange={setEntry} />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '20px',
          padding: '0 16px'
        }}>
          <Attachments onAttach={handleAttachment} />
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