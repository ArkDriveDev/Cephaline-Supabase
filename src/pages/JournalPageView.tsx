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
  IonActionSheet
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
      } finally {
        setLoading(false);
      }
    };

    if (journalId && pageId) fetchPageData();
  }, [journalId, pageId]);

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
    history.push(`/Cephaline-Supabase/app/JournalPage/${journalId}/${pageId}`);
  };

  const handleAddContent = () => {
    history.push(`/Cephaline-Supabase/app/JournalPage/${journalId}/${pageId}/content`);
  };

  const createZipFile = async () => {
    const zip = new JSZip();
    const folderName = page.page_title || 'journal-page';
    
    // Add all content to the zip
    const folder = zip.folder(folderName);
    
    // Add a text file with the page content
    let textContent = `Title: ${page.page_title}\n\n`;
    textContent += `Mood: ${page.mood || 'Not specified'}\n\n`;
    textContent += `Created: ${formatDate(page.created_at)}\n`;
    if (page.updated_at !== page.created_at) {
      textContent += `Updated: ${formatDate(page.updated_at)}\n`;
    }
    textContent += '\n\nContents:\n\n';
    
    contents.forEach((item, index) => {
      textContent += `Item ${index + 1}:\n`;
      if (item.paragraph) textContent += `${item.paragraph}\n\n`;
      if (item.link) textContent += `Link: ${item.link}\n\n`;
      if (item.image_url) textContent += `Image: ${item.image_url}\n\n`;
      if (item.file_url) textContent += `File: ${item.file_url}\n\n`;
      if (item.folder_name) textContent += `Folder: ${item.folder_name}\n\n`;
    });
    
    folder?.file('page-content.txt', textContent);
    
    // Add images if available
    const imageContents = contents.filter(item => item.image_url);
    for (const item of imageContents) {
      try {
        const response = await fetch(item.image_url!);
        const blob = await response.blob();
        folder?.file(`image-${item.content_order}.${item.image_url?.split('.').pop() || 'jpg'}`, blob);
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    }
    
    return await zip.generateAsync({ type: 'blob' });
  };

  const handleDownload = async () => {
    try {
      const content = await createZipFile();
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${page.page_title || 'journal-page'}.zip`;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating zip:', error);
    }
  };

  const handleUploadToGoogleDrive = async () => {
    try {
      setUploadingToDrive(true);
      
      // Create the zip file
      const zipBlob = await createZipFile();
      
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`File "${page.page_title || 'journal-page'}.zip" would be uploaded to Google Drive in a real implementation.`);
      
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      alert('Failed to upload to Google Drive. Please try again.');
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
      history.push(`/cephaline-supabase/app/JournalPageView/${journalId}/${targetPageId}`);
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
              <IonBackButton defaultHref={`/cephaline-supabase/app/Overviewing/${journalId}`} />
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
              <IonBackButton defaultHref={`/cephaline-supabase/app/Overviewing/${journalId}`} style={{ color: 'skyblue' }} />
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
        style={{ '--width': '300px',
          '--height': 'auto',
          '--max-width': '90%',
          'position': 'fixed',
          'top': '50%',
          'left': '50%',
          'transform': 'translate(-50%, -50%)',}}
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