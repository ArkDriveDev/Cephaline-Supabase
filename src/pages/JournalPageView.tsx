import React, { useEffect, useState } from 'react';
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
  IonBadge
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';
import { chevronBack, chevronForward, createOutline, addOutline } from 'ionicons/icons';
import './JournalPageView.css';

const JournalPageView: React.FC = () => {
  const { journalId, pageId } = useParams<{ journalId: string, pageId: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contentCount, setContentCount] = useState(0);
  const [adjacentPages, setAdjacentPages] = useState<{prev: string | null, next: string | null}>({prev: null, next: null});
  const history = useHistory();

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        
        // Fetch current page
        const { data: pageData, error: pageError } = await supabase
          .from('journal_pages')
          .select('*')
          .eq('page_id', pageId)
          .single();

        if (pageError) throw pageError;
        setPage(pageData);

        // Fetch content count
        const { count: contentCount, error: countError } = await supabase
          .from('journal_page_contents')
          .select('*', { count: 'exact' })
          .eq('page_id', pageId);

        if (!countError && contentCount) setContentCount(contentCount);

        // Fetch adjacent pages
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

  const handleEdit = () => {
    history.push(`/cephaline-supabase/app/JournalPage/${journalId}/${pageId}`);
  };

  const handleAddContent = () => {
    history.push(`/cephaline-supabase/app/JournalPage/${journalId}/${pageId}/content`);
  };

  const handleViewContents = () => {
    history.push(`/cephaline-supabase/app/JournalPageView/${journalId}/${pageId}/contents`);
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
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/cephaline-supabase/app/Overviewing/${journalId}`} />
          </IonButtons>
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
        <div className="journal-page-container">
          <div className="journal-page-header">
            <h1>{page.page_title}</h1>
            {page.mood && <IonBadge color="tertiary">{page.mood}</IonBadge>}
            <div className="page-metadata">
              <IonText color="medium">
                <small>Created: {formatDate(page.created_at)}</small>
                {page.updated_at !== page.created_at && (
                  <small> • Updated: {formatDate(page.updated_at)}</small>
                )}
              </IonText>
            </div>
          </div>

          <div className="journal-page-text">
            <IonText>
              {page.content || <p className="empty-content">This page doesn't have any content yet.</p>}
            </IonText>
          </div>

          <div className="content-actions">
            <IonButton 
              fill="solid" 
              color="primary"
              onClick={handleViewContents}
              disabled={contentCount === 0}
            >
              View Contents
              <IonBadge color="light" style={{ marginLeft: '8px' }}>
                {contentCount}
              </IonBadge>
            </IonButton>
          </div>

          <div className="page-navigation">
            <IonButton 
              fill="clear" 
              disabled={!adjacentPages.prev}
              onClick={() => adjacentPages.prev && history.push(`/cephaline-supabase/app/JournalPageView/${journalId}/${adjacentPages.prev}`)}
            >
              <IonIcon slot="start" icon={chevronBack} />
              Previous
            </IonButton>
            
            <IonButton 
              fill="clear" 
              disabled={!adjacentPages.next}
              onClick={() => adjacentPages.next && history.push(`/cephaline-supabase/app/JournalPageView/${journalId}/${adjacentPages.next}`)}
            >
              Next
              <IonIcon slot="end" icon={chevronForward} />
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JournalPageView;