import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
  IonText,
  IonLoading,
  IonBadge,
  IonImg,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonActionSheet,
  useIonToast
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import {
  chevronBack,
  chevronForward,
  createOutline,
  addOutline,
  linkOutline,
  documentOutline,
  imageOutline,
  folderOutline,
  happyOutline,
  sadOutline,
  heartOutline,
  alertOutline,
  thumbsUpOutline,
  thumbsDownOutline,
  helpOutline,
  downloadOutline,
  cloudUploadOutline,
  closeOutline
} from 'ionicons/icons';
import './JournalPageView.css';

const moodIcons: Record<string, any> = {
  happy: happyOutline,
  sad: sadOutline,
  love: heartOutline,
  angry: alertOutline,
  like: thumbsUpOutline,
  dislike: thumbsDownOutline,
  default: helpOutline
};

interface ContentItem {
  content_id: string;
  content_order: number;
  paragraph: string | null;
  link: string | null;
  image_url: string | null;
  file_url: string | null;
  folder_name: string | null;
  created_at: string;
  updated_at: string;
}


const JournalPageView: React.FC = () => {
  const { journalId, pageId } = useParams<{ journalId: string, pageId: string }>();
  const [page, setPage] = useState<any>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjacentPages, setAdjacentPages] = useState<{ prev: string | null, next: string | null }>({ prev: null, next: null });
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [present] = useIonToast();
  const history = useHistory();

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);

        const { data: pageData, error: pageError } = await supabase
          .from('journal_pages')
          .select('*')
          .eq('page_id', pageId)
          .single();

        if (pageError) throw pageError;
        setPage(pageData);

        const { data: contentsData, error: contentsError } = await supabase
          .from('journal_page_contents')
          .select('*')
          .eq('page_id', pageId)
          .order('content_order', { ascending: true });

        if (contentsError) throw contentsError;
        setContents(contentsData || []);

        const { data: adjacentData, error: adjacentError } = await supabase
          .from('journal_pages')
          .select('page_id, page_no')
          .eq('journal_id', journalId)
          .order('page_no', { ascending: true });

        if (adjacentError) throw adjacentError;

        const currentIndex = adjacentData.findIndex(p => p.page_id === pageId);
        setAdjacentPages({
          prev: currentIndex > 0 ? adjacentData[currentIndex - 1].page_id : null,
          next: currentIndex < adjacentData.length - 1 ? adjacentData[currentIndex + 1].page_id : null
        });

      } catch (error) {
        console.error('Error fetching page:', error);
        present({
          message: 'Failed to load page data',
          duration: 3000,
          color: 'danger'
        });
      } finally {
        setLoading(false);
      }
    };

    if (journalId && pageId) fetchPageData();
  }, [journalId, pageId, present]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodIcon = (mood: string) => {
    const normalizedMood = mood.toLowerCase();
    return moodIcons[normalizedMood] || moodIcons.default;
  };

  const handleEdit = () => {
    history.push(`/#/app/JournalPage/${journalId}/${pageId}`);
  };

  const handleAddContent = () => {
    history.push(`/#/app/JournalPage/${journalId}/${pageId}/content`);
  };

  interface ContentEntry {
    order: number;
    type: string;
    data: string | null;
    downloadError?: string;
  }
  
  const createZipFile = async () => {
    if (!page) throw new Error('Page data not loaded');
    
    const zip = new JSZip();
    const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const folderName = sanitizeName(page.page_title || `page_${page.page_no}`);
    const pageFolder = zip.folder(folderName);
  
    // Create text content instead of JSON metadata
    let textContent = `Title: ${page.page_title || 'Untitled Page'}\n`;
    textContent += `Page Number: ${page.page_no}\n`;
    textContent += `Mood: ${page.mood || 'Not specified'}\n`;
    textContent += `Created: ${new Date(page.created_at).toLocaleString()}\n`;
    if (page.updated_at !== page.created_at) {
      textContent += `Updated: ${new Date(page.updated_at).toLocaleString()}\n`;
    }
    textContent += '\n==== Contents ====\n\n';
  
    // Process content items
    for (const item of contents) {
      textContent += `[Item ${item.content_order}]\n`;
      textContent += `Type: ${item.paragraph ? 'Text' : item.link ? 'Link' : item.image_url ? 'Image' : item.file_url ? 'File' : item.folder_name ? 'Folder' : 'Unknown'}\n`;
  
      if (item.paragraph) {
        textContent += `${item.paragraph}\n\n`;
        pageFolder?.file(`content_${item.content_order}.txt`, item.paragraph);
      } 
      else if (item.link) {
        textContent += `URL: ${item.link}\n\n`;
        pageFolder?.file(`link_${item.content_order}.url`, `[InternetShortcut]\nURL=${item.link}`);
      }
      else if (item.image_url || item.file_url) {
        const fileUrl = item.image_url || item.file_url || '';
        const filename = fileUrl.split('/').pop() || `file_${item.content_order}`;
        
        textContent += `Filename: ${filename}\n`;
        
        try {
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const blob = await response.blob();
          pageFolder?.file(filename, blob);
          textContent += `Status: Downloaded successfully\n\n`;
        } catch (err) {
          const error = err as Error;
          textContent += `Status: Download failed (${error.message})\n\n`;
        }
      }
      else if (item.folder_name) {
        textContent += `Folder: ${item.folder_name}\n\n`;
      }
    }
  
    // Add text file instead of JSON
    pageFolder?.file('page_contents.txt', textContent);
    
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
  };
  const handleDownload = async () => {
    try {
      setLoading(true);
      const content = await createZipFile();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${page.page_title || 'journal-page'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      
      present({
        message: 'Download started successfully',
        duration: 3000,
        color: 'success'
      });
    } catch (error) {
      console.error('Error creating zip:', error);
      present({
        message: 'Failed to prepare download. Please try again.',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadToGoogleDrive = async () => {
    try {
      setUploadingToDrive(true);
      
      const zipBlob = await createZipFile();
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      present({
        message: `File "${page.page_title || 'journal-page'}.zip" would be uploaded to Google Drive in a real implementation.`,
        duration: 3000,
        color: 'success'
      });
      
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      present({
        message: 'Failed to upload to Google Drive. Please try again.',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setUploadingToDrive(false);
    }
  };

  const navigateWithSlide = (direction: 'prev' | 'next') => {
    if (isAnimating) return;

    const targetPageId = direction === 'prev' ? adjacentPages.prev : adjacentPages.next;
    if (!targetPageId) return;

    setIsAnimating(true);
    setSlideDirection(direction === 'prev' ? 'right' : 'left');

    setTimeout(() => {
      history.push(`/#/app/JournalPageView/${journalId}/${targetPageId}`);
      setIsAnimating(false);
      setSlideDirection(null);
    }, 300);
  };

  const renderContentItem = (item: ContentItem) => {
    const getIcon = () => {
      if (item.paragraph) return documentOutline;
      if (item.image_url) return imageOutline;
      if (item.link) return linkOutline;
      if (item.file_url || item.folder_name) return folderOutline;
      return documentOutline;
    };

    return (
      <IonCard key={item.content_id} className="content-item">
        <IonCardContent>
          <IonItem lines="none">
            <IonIcon icon={getIcon()} slot="start" />
            <IonLabel>Item #{item.content_order}</IonLabel>
          </IonItem>

          {item.paragraph && (
            <div className="content-paragraph">
              <IonText>{item.paragraph}</IonText>
            </div>
          )}

          {item.image_url && (
            <div className="content-image">
              <IonImg
                src={item.image_url}
                alt={`Content ${item.content_order}`}
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
            </div>
          )}

          {item.link && (
            <IonButton
              fill="clear"
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IonIcon icon={linkOutline} slot="start" />
              Open Link
            </IonButton>
          )}

          {item.file_url && (
            <IonButton
              fill="clear"
              href={item.file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IonIcon icon={folderOutline} slot="start" />
              View File
            </IonButton>
          )}

          {item.folder_name && (
            <IonText color="medium">
              <p>Folder: {item.folder_name}</p>
            </IonText>
          )}
        </IonCardContent>
      </IonCard>
    );
  };

  if (loading) {
    return (
      <IonPage>
        <IonLoading isOpen={loading} message="Loading page..." />
      </IonPage>
    );
  }

  if (!page) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={`/#/app/Overviewing/${journalId}`} />
            </IonButtons>
            <IonTitle>Page Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="ion-padding">The requested page could not be found.</div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Page {page.page_no}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleAddContent}>
              <IonIcon slot="icon-only" icon={addOutline} />
            </IonButton>
            <IonButton onClick={handleEdit}>
              <IonIcon slot="icon-only" icon={createOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="journal-page-content">
        <div className={`slide-container ${slideDirection ? 'slide-' + slideDirection : ''}`}>
          <div className="journal-page-container">
            <IonButtons slot="start">
              <IonBackButton defaultHref={`/#/app/Overviewing/${journalId}`} style={{ color: 'skyblue' }} />
            </IonButtons>

            <div className="journal-page-header">
              <div className="page-title-with-download">
                <h1 style={{ marginRight: '12px' }}>{page.page_title}</h1>
                <IonButton fill="clear" size="small" onClick={() => setShowActionSheet(true)}>
                  <IonIcon icon={downloadOutline} slot="start" />
                  Export
                </IonButton>
              </div>

              {page.mood && (
                <div className="mood-display">
                  <IonIcon
                    icon={getMoodIcon(page.mood)}
                    style={{ marginRight: '6px', color: 'var(--ion-color-primary)' }}
                  />
                  <IonBadge color="tertiary">
                    {page.mood.charAt(0).toUpperCase() + page.mood.slice(1)}
                  </IonBadge>
                </div>
              )}
              <div className="page-metadata">
                <IonText color="medium">
                  <small>Created: {formatDate(page.created_at)}</small>
                  {page.updated_at !== page.created_at && (
                    <small> • Updated: {formatDate(page.updated_at)}</small>
                  )}
                </IonText>
              </div>
            </div>

            <div className="contents-section">
              <h2 className="contents-title">
                Page Contents
                <IonBadge color="primary" style={{ marginLeft: '8px' }}>
                  {contents.length}
                </IonBadge>
              </h2>

              {contents.length === 0 ? (
                <div className="empty-contents">
                  <IonText color="medium">No content items yet.</IonText>
                  <IonButton fill="clear" onClick={handleAddContent}>
                    Add Content
                  </IonButton>
                </div>
              ) : (
                <div className="contents-list">
                  {contents.map(renderContentItem)}
                </div>
              )}
            </div>

            <div className="page-navigation">
              <IonButton
                fill="clear"
                disabled={!adjacentPages.prev || isAnimating}
                onClick={() => navigateWithSlide('prev')}
              >
                <IonIcon slot="start" icon={chevronBack} />
                Previous
              </IonButton>

              <IonButton
                fill="clear"
                disabled={!adjacentPages.next || isAnimating}
                onClick={() => navigateWithSlide('next')}
              >
                Next
                <IonIcon slot="end" icon={chevronForward} />
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: 'Download to Device',
            icon: downloadOutline,
            handler: () => {
              handleDownload();
            }
          },
          {
            text: 'Upload to Google Drive',
            icon: cloudUploadOutline,
            handler: () => {
              handleUploadToGoogleDrive();
            }
          },
          {
            text: 'Cancel',
            icon: closeOutline,
            role: 'cancel'
          }
        ]}
      />

      <IonLoading isOpen={uploadingToDrive} message="Uploading to Google Drive..." />
    </IonPage>
  );
};

export default JournalPageView;