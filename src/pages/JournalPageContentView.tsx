import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonLoading,
  IonCard,
  IonCardContent,
  IonImg,
  IonButton,
  IonIcon,
  IonText
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import { documentTextOutline, imageOutline, linkOutline, folderOpenOutline } from 'ionicons/icons';

interface ContentItem {
  content_id: string;
  content_order: number;
  paragraph: string | null;
  link: string | null;
  image_url: string | null;
  file_url: string | null;
  folder_name: string | null;
}

const JournalPageContentView: React.FC = () => {
  const { journalId, pageId } = useParams<{ journalId: string, pageId: string }>();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('journal_page_contents')
          .select('*')
          .eq('page_id', pageId)
          .order('content_order', { ascending: true });

        if (error) throw error;
        setContents(data || []);
      } catch (error) {
        console.error('Error fetching contents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (pageId) fetchContents();
  }, [pageId]);

  const getContentIcon = (item: ContentItem) => {
    if (item.paragraph) return documentTextOutline;
    if (item.image_url) return imageOutline;
    if (item.link) return linkOutline;
    if (item.file_url || item.folder_name) return folderOpenOutline;
    return documentTextOutline;
  };

  const renderContent = (item: ContentItem) => {
    if (item.paragraph) {
      return <IonText>{item.paragraph}</IonText>;
    }
    if (item.image_url) {
      return (
        <IonImg 
          src={item.image_url} 
          alt="Journal content" 
          style={{ maxHeight: '300px', objectFit: 'contain' }}
        />
      );
    }
    if (item.link) {
      return (
        <IonButton 
          fill="clear" 
          href={item.link} 
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Link
        </IonButton>
      );
    }
    if (item.file_url) {
      return (
        <IonButton 
          fill="clear" 
          href={item.file_url} 
          target="_blank"
          rel="noopener noreferrer"
        >
          View File
        </IonButton>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <IonPage>
        <IonLoading isOpen={loading} message="Loading content..." />
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/cephaline-supabase/app/JournalPageView/${journalId}/${pageId}`} />
          </IonButtons>
          <IonTitle>Page Content</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {contents.length === 0 ? (
          <div className="ion-padding">No content found for this page.</div>
        ) : (
          <div className="content-container">
            {contents.map((item) => (
              <IonCard key={item.content_id}>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <IonIcon icon={getContentIcon(item)} style={{ marginRight: '8px' }} />
                    <IonText color="medium">Item #{item.content_order}</IonText>
                  </div>
                  {renderContent(item)}
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default JournalPageContentView;