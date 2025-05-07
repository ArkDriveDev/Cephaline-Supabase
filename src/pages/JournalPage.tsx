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
  IonCardContent
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import Journalized from '../components/JournalPage_omponents/Journalized';
import Attachments from '../components/JournalPage_omponents/Attachements';
import SavePage from '../components/JournalPage_omponents/SavePage';
import Spectrum from '../components/JournalPage_omponents/Spectrum';


interface JournalBlock {
  type: 'paragraph' | 'link' | 'image' | 'file' | 'folder';
  content: string;
}

const JournalPage: React.FC = () => {
  const { journalId: rawJournalId } = useParams<{ journalId: string }>();
  const journalId = rawJournalId?.startsWith(':') ? rawJournalId.slice(1) : rawJournalId;
  
  const [markdownContent, setMarkdownContent] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [present] = useIonToast();

  const handleAddAttachment = (attachment: { type: string; content: string }) => {
    let formattedContent = '';
    switch(attachment.type) {
      case 'image':
        formattedContent = `\n![${attachment.content.split('/').pop()}](${attachment.content})\n`;
        break;
      case 'file':
        formattedContent = `\n[file: ${attachment.content.split('/').pop()}](${attachment.content})\n`;
        break;
      case 'folder':
        formattedContent = `\n[folder: ${attachment.content.split('/').pop()}](${attachment.content})\n`;
        break;
      default:
        formattedContent = `\n${attachment.content}\n`;
    }
    setMarkdownContent(prev => prev + formattedContent);
  };

  const parseContent = (markdown: string): JournalBlock[] => {
    const blocks: JournalBlock[] = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // Image detection (markdown format)
      const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (imageMatch) {
        blocks.push({ type: 'image', content: imageMatch[2] });
        continue;
      }

      // File detection (custom format)
      const fileMatch = line.match(/\[file: (.*?)\]\((.*?)\)/);
      if (fileMatch) {
        blocks.push({ type: 'file', content: fileMatch[2] });
        continue;
      }

      // Folder detection (custom format)
      const folderMatch = line.match(/\[folder: (.*?)\]\((.*?)\)/);
      if (folderMatch) {
        blocks.push({ type: 'folder', content: folderMatch[2] });
        continue;
      }

      // Regular link detection (markdown format)
      const linkMatch = line.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch && !line.includes('file:') && !line.includes('folder:')) {
        blocks.push({ type: 'link', content: linkMatch[2] });
        continue;
      }

      // Default to paragraph
      blocks.push({ type: 'paragraph', content: line });
    }

    return blocks;
  };

  const validateInputs = (): boolean => {
    if (!journalId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(journalId)) {
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
    if (!validateInputs()) return;

    setIsSaving(true);

    try {
      // Get last page number
      const { data: lastPage, error: pageError } = await supabase
        .from('journal_pages')
        .select('page_no')
        .eq('journal_id', journalId)
        .order('page_no', { ascending: false })
        .limit(1);

      if (pageError) throw pageError;
      const nextPageNo = lastPage?.[0]?.page_no ? lastPage[0].page_no + 1 : 1;

      // Create new page
      const { data: newPage, error: insertError } = await supabase
        .from('journal_pages')
        .insert({
          journal_id: journalId,
          page_title: pageTitle.trim(),
          page_no: nextPageNo,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Parse and insert content
      const contentBlocks = parseContent(markdownContent);
      const contentInserts = contentBlocks.map((block, index) => ({
        page_id: newPage.page_id,
        content_order: index + 1,
        paragraph: block.type === 'paragraph' ? block.content : null,
        link: block.type === 'link' ? block.content : null,
        image_url: block.type === 'image' ? block.content : null,
        file_url: block.type === 'file' ? block.content : null,
        folder_name: block.type === 'folder' ? block.content : null,
      }));

      const { error: contentError } = await supabase
        .from('journal_page_contents')
        .insert(contentInserts);

      if (contentError) throw contentError;

      present({ message: 'Journal page saved successfully!', duration: 2000, color: 'success' });

      // Reset form
      setMarkdownContent('');
      setPageTitle('');
    } catch (error: any) {
      console.error('Save error:', error);
      present({
        message: `Failed to save journal page: ${error.message}`,
        duration: 3000,
        color: 'danger',
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
       <Spectrum/>

        <Journalized
          markdownContent={markdownContent}
          onContentChange={setMarkdownContent}
        />

        <Attachments onAttach={handleAddAttachment} />

        <SavePage
          onSave={handleSave}
          disabled={!pageTitle.trim() || !markdownContent.trim() || isSaving}
          loading={isSaving}
        />
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;