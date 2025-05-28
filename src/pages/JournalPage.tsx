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
  useIonRouter,
  IonButton,
  IonIcon,
  IonAlert
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import Journalized from '../components/JournalPage_omponents/Journalized';
import SavePage from '../components/JournalPage_omponents/SavePage';
import Spectrum from '../components/JournalPage_omponents/Spectrum';
import Attachments from '../components/JournalPage_omponents/Attachements';

// UUID validation fallback (works without the uuid package)
const isUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

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
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [present] = useIonToast();

  // Early return if invalid journalId
  if (!journalId || !isUUID(journalId)) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonCard color="danger">
            <IonCardContent>
              Invalid Journal ID format. Please go back and try again.
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

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
          mood: selectedMood
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
    navigation.push('/#/app', 'forward', 'replace');
  };

  const handleDeleteJournal = async () => {
    try {
      setIsSaving(true);

      // First delete all files associated with this journal from storage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const filesToDelete = `${user.id}/${journalId}`;
        const { error: deleteFilesError } = await supabase.storage
          .from('journal-contents')
          .remove([filesToDelete]);

        if (deleteFilesError) {
          console.error('Error deleting files:', deleteFilesError);
        }
      }

      // Then delete all pages in the journal
      const { error: deletePagesError } = await supabase
        .from('journal_pages')
        .delete()
        .eq('journal_id', journalId);
      
      if (deletePagesError) throw deletePagesError;

      // Finally delete the journal itself
      const { error: deleteJournalError } = await supabase
        .from('journals')
        .delete()
        .eq('journal_id', journalId);
      
      if (deleteJournalError) throw deleteJournalError;

      present({
        message: 'Journal deleted successfully',
        duration: 2000,
        color: 'success'
      });
      
      navigation.push('/#/app', 'forward', 'replace');
    } catch (error: any) {
      present({
        message: `Failed to delete journal: ${error.message}`,
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setIsSaving(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {/* Empty toolbar to maintain your layout */}
        </IonToolbar>
      </IonHeader>

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={'Delete Journal'}
        message={'Are you sure you want to delete this journal and all its contents? This action cannot be undone.'}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Delete',
            handler: handleDeleteJournal
          }
        ]}
      />

      <IonContent className="ion-padding">
        <IonCard style={{ marginBottom: '20px' }}>
          <IonCardContent>
            {/* YOUR EXACT BUTTON LAYOUT PRESERVED */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
              <IonButtons slot="start">
                <IonBackButton defaultHref="/#/app/home" />
              </IonButtons>
              <IonButtons slot="end">
                <IonButton color="danger" onClick={() => setShowDeleteAlert(true)}>
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </IonButtons>
            </div>
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