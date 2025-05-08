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
  IonToast
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import OverViewcard from '../components/OverView_com/OverViewcard';
import OverviewSideCard from '../components/OverView_com/OverviewsideCard';
import { supabase } from '../utils/supaBaseClient';

const Overviewing: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const [journalTitle, setJournalTitle] = useState('');
  const [journalDescription, setJournalDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (journalId) {
      fetchJournalDetails();
    }
  }, [journalId]);

  const fetchJournalDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('title, description')
        .eq('journal_id', journalId)
        .single();

      if (error) throw error;

      setJournalTitle(data.title);
      setJournalDescription(data.description || '');
    } catch (error) {
      console.error('Error fetching journal:', error);
      setToastMessage('Failed to load journal');
      setShowToast(true);
    } finally {
      setLoading(false);
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
        <div className="overview-container">
          {loading ? (
            <IonSpinner name="crescent" />
          ) : (
            <OverViewcard
              journalId={journalId}
              journalTitle={journalTitle}
              journalDescription={journalDescription}
              onUpdate={fetchJournalDetails}
            />
          )}
          <OverviewSideCard journalId={journalId} />
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
