import React, { useState } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  useIonToast,
  useIonRouter 
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import PageTitle from '../components/JournalPage_omponents/PageTitle';
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Journalized from '../components/JournalPage_omponents/Journalized';
import SavePage from '../components/JournalPage_omponents/SavePage';


const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [entry, setEntry] = useState('');
  const [pageTitle, setPageTitle] = useState('Untitled Entry');
  const [mood, setMood] = useState('Neutral');
  const [isSaving, setIsSaving] = useState(false);
  const [present] = useIonToast();
  const router = useIonRouter();

  const getNextPageNumber = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('journal_pages')
        .select('page_no')
        .eq('journal_id', journalId || '') // Handle potential undefined
        .order('page_no', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data || data.length === 0) return 1;
      return data[0].page_no + 1;
    } catch (error: any) {
      console.error('Page number error:', error.message);
      present({
        message: 'Error loading journal data',
        duration: 3000,
        color: 'danger'
      });
      return 1; // Fallback
    }
  };

  const handleSave = async () => {
    if (!entry.trim()) {
      present({ message: 'Journal content required', duration: 2000, color: 'warning' });
      return;
    }

    setIsSaving(true);

    try {
      // Validate journalId is a valid UUID
      if (!journalId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(journalId)) {
        throw new Error('Invalid journal ID format');
      }

      const pageNo = await getNextPageNumber();

      // Create journal page
      const { data: page, error: pageError } = await supabase
        .from('journal_pages')
        .insert({
          journal_id: journalId,
          page_title: pageTitle || 'Untitled Entry',
          mood: mood,
          page_no: pageNo
        })
        .select('page_id, journal_id')
        .single();

      if (pageError) throw pageError;

      // Create content
      const { error: contentError } = await supabase
        .from('journal_page_contents')
        .insert({
          page_id: page.page_id,
          content_order: 1,
          paragraph: entry,
          created_at: new Date().toISOString()
        });

      if (contentError) {
        // Rollback page creation
        await supabase
          .from('journal_pages')
          .delete()
          .eq('page_id', page.page_id);
        throw contentError;
      }

      present({ message: 'Saved successfully!', duration: 2000, color: 'success' });
      router.push('/cephaline-supabase/app/home');
    } catch (error: any) {
      console.error('Save error:', error);
      present({
        message: error.message || 'Failed to save journal',
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
          <IonTitle>New Entry</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageTitle onTitleChange={setPageTitle} />
        <Spectrum onMoodChange={setMood} />
        <Journalized entry={entry} onEntryChange={setEntry} />
        <SavePage
          onSave={handleSave} 
          disabled={isSaving || !entry.trim()} 
        />
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;