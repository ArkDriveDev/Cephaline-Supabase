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
  IonLabel,
  IonItem,
  IonRange,
  IonIcon
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { happy, sad, heart, removeCircle, alertCircle } from 'ionicons/icons';
import PageTitle from '../components/JournalPage_omponents/PageTitle';
import Journalized from '../components/JournalPage_omponents/Journalized';
import Attachments from '../components/JournalPage_omponents/Attachements';
import SavePage from '../components/JournalPage_omponents/SavePage';
import { supabase } from '../utils/supaBaseClient';

interface MoodLevel {
  level: string;
  min: number;
  max: number;
  color: string;
  icon: string;
}

const JournalPage: React.FC = () => {
  let { journalId } = useParams<{ journalId: string }>();
  journalId = journalId.replace(/^:/, ''); 
  const [entry, setEntry] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [moodValue, setMoodValue] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [present] = useIonToast();

  const moodLevels: MoodLevel[] = [
    { level: 'Angry', min: 0, max: 20, color: '#F44336', icon: alertCircle },
    { level: 'Sad', min: 20, max: 40, color: '#FF9800', icon: sad },
    { level: 'Neutral', min: 40, max: 60, color: '#FFC107', icon: removeCircle },
    { level: 'Happy', min: 60, max: 80, color: '#8BC34A', icon: happy },
    { level: 'Super Happy', min: 80, max: 100, color: '#4CAF50', icon: heart }
  ];

  const getCurrentMood = (): MoodLevel => {
    return moodLevels.find(level => moodValue >= level.min && moodValue <= level.max) || moodLevels[2];
  };

  const currentMood = getCurrentMood();

  const validateInputs = (): boolean => {
    if (!journalId) {
      present({ message: 'No journal ID provided', duration: 2000, color: 'danger' });
      return false;
    }

    if (!entry.trim()) {
      present({ message: 'Entry cannot be empty', duration: 2000, color: 'warning' });
      return false;
    }

    if (entry.length > 10000) {
      present({ message: 'Entry is too long (max 10,000 characters)', duration: 2000, color: 'warning' });
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

    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

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
          mood: currentMood.level,
          page_no: nextPageNo
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: contentError } = await supabase
        .from('journal_page_contents')
        .insert({
          page_id: newPage.page_id,
          content_order: 1,
          paragraph: entry.trim()
        });

      if (contentError) throw contentError;

      present({
        message: 'Journal page saved successfully!',
        duration: 2000,
        color: 'success'
      });

      setEntry('');
      setPageTitle('');
      setMoodValue(50);
    } catch (error: any) {
      console.error('Full error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      let errorMessage = 'Failed to save journal page';
      if (error.code === '23503') {
        errorMessage = 'Invalid journal reference';
      } else if (error.code === '23505') {
        errorMessage = 'Page number already exists';
      }

      present({
        message: `${errorMessage}: ${error.details || error.message}`,
        duration: 3000,
        color: 'danger'
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
        <p>Viewing journal entry {journalId}</p>

        <PageTitle onTitleChange={setPageTitle} />

        <h1 style={{ margin: '30px 0' }}>How are you feeling today?</h1>

        <IonItem lines="none" style={{ flexDirection: 'column', alignItems: 'flex-start', width: '100%', margin: '30px 0 50px 0' }}>
          <IonLabel>Mood Spectrum</IonLabel>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <IonIcon icon={currentMood.icon} style={{ color: currentMood.color }} />
            <IonRange
              min={0}
              max={100}
              value={moodValue}
              onIonChange={(e) => setMoodValue(e.detail.value as number)}
              style={{ 
                flex: 1, 
                margin: '0 12px',
                '--bar-background': `linear-gradient(to right, 
                  ${moodLevels.map(level => `${level.color} ${level.min}%, ${level.color} ${level.max}%`).join(', ')}` 
              }}
            />
            <IonIcon icon={currentMood.icon} style={{ color: currentMood.color }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px' }}>
            {moodLevels.map(level => (
              <div key={level.level} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IonIcon icon={level.icon} style={{ color: level.color, fontSize: '16px' }} />
                <span style={{ fontSize: '10px', marginTop: '4px' }}>{level.level}</span>
              </div>
            ))}
          </div>
          <IonLabel style={{ 
            fontSize: '14px', 
            marginTop: '12px',
            margin: '10px',
            color: currentMood.color,
            fontWeight: 'bold'
          }}>
            Current Mood: {currentMood.level}
          </IonLabel>
        </IonItem>

        <Journalized entry={entry} onEntryChange={setEntry} />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px'
        }}>
          <Attachments onAttach={(att) => setEntry(prev => `${prev}\n[${att.type}] ${att.content}`)} />
          <SavePage
            onSave={handleSave}
            disabled={!entry.trim() || !pageTitle.trim() || isSaving}
            loading={isSaving}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default JournalPage;
