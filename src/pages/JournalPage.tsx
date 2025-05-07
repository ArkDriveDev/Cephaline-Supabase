import React, { useState, useEffect } from 'react';
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonMenuButton,
  useIonToast,
  useIonRouter
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient'; 
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
  const [entry, setEntry] = useState<string>('');
  const [mood, setMood] = useState<string>('Neutral');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [present] = useIonToast();
  const router = useIonRouter();

  // Validate journalId on component mount
  useEffect(() => {
    const isValidUUID = (id: string) => {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    };

    if (!journalId || !isValidUUID(journalId)) {
      present({
        message: 'Invalid journal ID',
        duration: 3000,
        color: 'danger'
      });
      router.push('/cephaline-supabase/app/home');
    }
    setIsLoading(false);
  }, [journalId, present, router]);

  const handleAttach = (attachment: Attachment) => {
    const formatted = `\n[${attachment.type.toUpperCase()}] ${attachment.content}`;
    setEntry((prev) => prev + formatted);
  };

  const getNextPageNumber = async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('journal_pages')
        .select('page_no')
        .eq('journal_id', journalId)
        .order('page_no', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data?.[0]?.page_no ? data[0].page_no + 1 : 1;
    } catch (error) {
      console.error('Error fetching page numbers:', error);
      return 1; // Fallback to first page
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!entry.trim()) {
      await present({
        message: 'Please write something before saving',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const pageNo = await getNextPageNumber();
      
      // Create journal page
      const { data: pageData, error: pageError } = await supabase
        .from('journal_pages')
        .insert({
          journal_id: journalId,
          page_title: `Entry ${pageNo}`,
          mood: mood,
          page_no: pageNo
        })
        .select()
        .single();

      if (pageError) throw pageError;

      // Create page content
      const { error: contentError } = await supabase
        .from('journal_page_contents')
        .insert({
          page_id: pageData.page_id,
          content_order: 1,
          paragraph: entry
        });

      if (contentError) {
        // Rollback page creation if content fails
        await supabase
          .from('journal_pages')
          .delete()
          .eq('page_id', pageData.page_id);
        throw contentError;
      }

      await present({
        message: 'Journal saved successfully!',
        duration: 2000,
        color: 'success'
      });
      router.push('/cephaline-supabase/app/home');
    } catch (error: any) {
      console.error('Save error:', error);
      await present({
        message: error.message || 'Failed to save journal',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>Loading journal...</IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Journal Entry</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageTitle />
        <h1 style={{ margin: '30px', marginTop: '80px' }}>How are you feeling today?</h1>
        
        <Spectrum onMoodChange={setMood} />
        
        <Journalized 
          entry={entry} 
          onEntryChange={setEntry} 
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '20px',
          padding: '0 30px'
        }}>
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