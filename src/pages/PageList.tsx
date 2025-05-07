import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButtons, IonBackButton } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { supabase } from '../utils/supaBaseClient'; // Adjust path as needed

interface Page {
  page_id: string;
  page_no: number;
  page_title: string;
  mood: string | null;
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
          .select('page_id, page_no, page_title, mood')
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/cephaline-supabase/app/Overviewing/${journalId}`} />
          </IonButtons>
          <IonTitle>Page List</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <IonList>
            {pages.map((page) => (
              <IonItem key={page.page_id} routerLink={`/cephaline-supabase/app/JournalPage/${journalId}/${page.page_id}`}>
                <IonLabel>
                  <h2>Page {page.page_no}: {page.page_title}</h2>
                  {page.mood && <p>Mood: {page.mood}</p>}
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