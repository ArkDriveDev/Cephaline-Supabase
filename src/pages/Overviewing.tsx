import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonSpinner,
  IonToast,
  useIonRouter
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import OverViewcard from '../components/OverView_com/OverViewcard';
import OverviewSideCard from '../components/OverView_com/OverviewsideCard';
import { supabase } from '../utils/supaBaseClient';
import './Overviewing.css';

const Overviewing: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [journalTitle, setJournalTitle] = useState('');
  const [journalDescription, setJournalDescription] = useState('');
  const [journalDate, setJournalDate] = useState('');
  const [colors, setColors] = useState({
    titleColor: '#3880ff',
    descriptionColor: '#555555',
    cardColor: '#ffffff',
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [firstPageId, setFirstPageId] = useState<string | null>(null);
  const router = useIonRouter();

  useEffect(() => {
    if (journalId) {
      fetchJournalDetails();
      fetchFirstPageId();
    }
  }, [journalId]);

  const fetchJournalDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('title, description, created_at, title_color, description_color, card_color')
        .eq('journal_id', journalId)
        .single();

      if (error) throw error;

      setJournalTitle(data.title);
      setJournalDescription(data.description || '');
      setJournalDate(data.created_at);
      setColors({
        titleColor: data.title_color || '#3880ff',
        descriptionColor: data.description_color || '#555555',
        cardColor: data.card_color || '#ffffff',
      });
    } catch (error) {
      console.error('Error fetching journal:', error);
      setToastMessage('Failed to load journal');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchFirstPageId = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_pages')
        .select('page_id')
        .eq('journal_id', journalId)
        .order('page_no', { ascending: true })
        .limit(1)
        .single();

      if (error) throw error;
      setFirstPageId(data?.page_id || null);
    } catch (error) {
      console.error('Error fetching first page:', error);
    }
  };

  const handleBookClick = () => {
    if (firstPageId) {
      router.push(`/cephaline-supabase/app/JournalPageView/${journalId}/${firstPageId}`);
    } else {
      setToastMessage('This journal has no pages yet');
      setShowToast(true);
    }
  };

  if (!journalId) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Error: No Journal Selected</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <p>Please select a journal from the main page.</p>
        </IonContent>
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
          <IonTitle>Journal Overview</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="overview-container" style={{ padding: '16px' }}>
          {loading ? (
            <IonSpinner name="crescent" />
          ) : (
            <>
              <OverViewcard
                journalId={journalId}
                journalTitle={journalTitle}
                journalDescription={journalDescription}
                onUpdate={fetchJournalDetails}
              />
            </>
          )}
          <OverviewSideCard journalId={journalId} />
        </div>

        {/* Clickable Book Cover View */}
        <div
          className="journal-cover clickable-book"
          onClick={handleBookClick}
          style={{
            backgroundColor: colors.cardColor,
            padding: '16px',
            borderRadius: '12px',
            margin: '20px auto',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            height: '650px',
            width: '500px',
            position: 'relative',
            borderBottom: '4px solid #d3d3d3',
            borderRight: '4px solid #d3d3d3',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          {/* Top Gray Line */}
          <div
            style={{
              height: '2px',
              backgroundColor: '#ccc',
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          />

          {/* Content */}
          <div style={{ paddingTop: '20px' }}>
            <h1 style={{ 
              color: colors.titleColor, 
              marginBottom: '8px', 
              textAlign: 'center',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}>
              {journalTitle}
            </h1>
            <p style={{ 
              color: colors.descriptionColor, 
              textAlign: 'center', 
              marginTop: '50px',
              fontSize: '1.2rem',
              padding: '0 20px'
            }}>
              {journalDescription}
            </p>
          </div>

          {/* Date */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.9rem', color: '#888' }}>
              Created:{' '}
              {new Date(journalDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Bottom Gray Line */}
          <div
            style={{
              height: '2px',
              backgroundColor: '#ccc',
              width: '100%',
              position: 'absolute',
              bottom: 0,
              left: 0
            }}
          />
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default Overviewing;