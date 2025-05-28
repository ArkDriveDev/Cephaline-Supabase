import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonNote,
  IonBadge
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient';

interface Page {
  page_id: string;
  page_no: number;
  page_title: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

const PageList: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const { data, error } = await supabase
          .from('journal_pages')
          .select('page_id, page_no, page_title, mood, created_at, updated_at')
          .eq('journal_id', journalId)
          .order('page_no', { ascending: true });

        if (error) throw error;
        setPages(data || []);
      } catch (error) {
        console.error('Error fetching pages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (journalId) fetchPages();
  }, [journalId]);

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div className="ion-padding">Loading pages...</div>
        ) : pages.length === 0 ? (
          <div className="ion-padding">No pages found for this journal.</div>
        ) : (
          <IonList>
            <IonButtons slot="start">
              <IonBackButton defaultHref={`/#/app/Overviewing/${journalId}`} />
            </IonButtons>
            {pages.map((page) => (
              <IonItem
                key={page.page_id}
                routerLink={`/#/app/JournalPageView/${journalId}/${page.page_id}`} // Updated to use JournalPageView
                detail
              >
                <IonLabel>
                  <h2>
                    <IonBadge color="medium" style={{ marginRight: '8px' }}>
                      {page.page_no}
                    </IonBadge>
                    {page.page_title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                    {page.mood && (
                      <IonBadge color="tertiary" style={{ marginRight: '8px' }}>
                        {page.mood}
                      </IonBadge>
                    )}
                    <IonNote style={{ fontSize: '0.8rem' }}>
                      Created: {formatDate(page.created_at)}
                    </IonNote>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PageList;