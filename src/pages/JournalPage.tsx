import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  useIonToast,
  IonItem,
  IonInput,
  IonCard,
  IonCardContent,
  useIonRouter
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import Journalized from '../components/JournalPage_omponents/Journalized';
import SavePage from '../components/JournalPage_omponents/SavePage';
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Attachments from '../components/JournalPage_omponents/Attachements';

interface JournalBlock {
  type: 'paragraph' | 'link' | 'image' | 'file' | 'folder';
  content: string;
}

interface Attachment {
  type: string;
  content: string | File;
  name?: string;
}

const JournalPage: React.FC = () => {
  const navigation = useIonRouter();
  const { journalId: rawJournalId } = useParams<{ journalId: string }>();
  const journalId = rawJournalId?.startsWith(':') ? rawJournalId.slice(1) : rawJournalId;
  
  const [markdownContent, setMarkdownContent] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [present] = useIonToast();

  const handleFileUploadWithProgress = async (file: File) => {
    setIsUploading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const userId = user?.id;
  
      if (userError || !userId) {
        throw new Error('You must be logged in to upload files');
      }
  
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${userId}/${journalId}/${timestamp}_${sanitizedFileName}`;
  
      const { data: uploadData, error } = await supabase.storage
        .from('journal-contents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
  
      if (error) throw error;
  
      const { data: urlData } = supabase.storage
        .from('journal-contents')
        .getPublicUrl(filePath);
  
      return urlData.publicUrl;
    } catch (error: any) {
      present({
        message: `Upload failed: ${error.message}`,
        duration: 3000,
        color: 'danger'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAttachment = async (attachment: Attachment) => {
    try {
      let contentUrl = attachment.content;
      
      if (attachment.content instanceof File) {
        const uploadedUrl = await handleFileUploadWithProgress(attachment.content);
        if (!uploadedUrl) return;
        contentUrl = uploadedUrl;
      }
  
      setMarkdownContent(prev => prev + `\n${contentUrl}\n`);
    } catch (error) {
      present({
        message: 'Failed to attach file',
        duration: 3000,
        color: 'danger'
      });
    }
  };

  const parseContent = (markdown: string): JournalBlock[] => {
    const blocks: JournalBlock[] = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        new URL(line.trim());
        blocks.push({ type: 'link', content: line.trim() });
        continue;
      } catch (e) {
        blocks.push({ type: 'paragraph', content: line });
      }
    }

    return blocks;
  };

  const validateInputs = (): boolean => {
    if (!journalId) {
      present({ message: 'Invalid journal selected', duration: 2000, color: 'danger' });
      return false;
    }

    if (!pageTitle.trim()) {
      present({ message: 'Page title cannot be empty', duration: 2000, color: 'warning' });
      return false;
    }

    if (pageTitle.length > 100) {
      present({ message: 'Title is too long (max 100 characters)', duration: 2000, color: 'warning' });
      return false;
    }

    if (!markdownContent.trim()) {
      present({ message: 'Journal content cannot be empty', duration: 2000, color: 'warning' });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInputs() || isUploading) return;

    setIsSaving(true);

    try {
      const { data: lastPage, error: pageError } = await supabase
        .from('journal_pages')
        .select('page_no')
        .eq('journal_id', journalId)
        .order('page_no', { ascending: false })
        .limit(1);

      if (pageError) throw pageError;
      const nextPageNo = lastPage?.[0]?.page_no ? lastPage[0].page_no + 1 : 1;

      const { data: newPage, error: insertError } = await supabase
        .from('journal_pages')
        .insert({
          journal_id: journalId,
          page_title: pageTitle.trim(),
          page_no: nextPageNo,
          mood: selectedMood // Store the selected mood
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const contentBlocks = parseContent(markdownContent);
      const contentInserts = contentBlocks.map((block, index) => ({
        page_id: newPage.page_id,
        content_order: index + 1,
        paragraph: block.type === 'paragraph' ? block.content : null,
        link: block.type === 'link' ? block.content : null,
      }));

      const { error: contentError } = await supabase
        .from('journal_page_contents')
        .insert(contentInserts);

      if (contentError) throw contentError;

      present({ message: 'Journal page saved successfully!', duration: 2000, color: 'success' });
      setMarkdownContent('');
      setPageTitle('');
      setSelectedMood(null);
    } catch (error: any) {
      present({
        message: `Failed to save: ${error.message}`,
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setIsSaving(false);
    }
    navigation.push('/cephaline-supabase/app', 'forward', 'replace');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/Cephaline-Supabase/app/journals" />
          </IonButtons>
          <IonTitle>New Journal Page</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard style={{ marginBottom: '20px' }}>
          <IonCardContent>
            <p>Viewing journal entry <strong>{journalId}</strong></p>
            <IonItem>
              <IonInput
                value={pageTitle}
                placeholder="Page Title"
                onIonChange={(e) => setPageTitle(e.detail.value!)}
              />
            </IonItem>
          </IonCardContent>
        </IonCard>

        <h2 style={{ margin: '20px 0' }}>How are you feeling today?</h2>
        <Spectrum 
          selectedMood={selectedMood}
          onMoodChange={setSelectedMood}
        />

        <Journalized
          markdownContent={markdownContent}
          onContentChange={setMarkdownContent}
        />

        <Attachments
          onAttach={handleAddAttachment}
          isUploading={isUploading}
        />

        <SavePage
          onSave={handleSave}
          disabled={!pageTitle.trim() || !markdownContent.trim() || isSaving || isUploading}
          loading={isSaving}
        />
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;