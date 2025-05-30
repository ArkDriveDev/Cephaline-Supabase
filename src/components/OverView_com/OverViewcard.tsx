import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  useIonRouter,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
  IonButtons,
  IonAlert,
  IonToast
} from '@ionic/react';
import { add, settings, close, trash } from 'ionicons/icons';
import { supabase } from '../../utils/supaBaseClient';

interface OverViewcardProps {
  journalId: string;
  journalTitle: string;
  journalDescription?: string;
  onUpdate?: () => void;
}

const OverViewcard: React.FC<OverViewcardProps> = ({ 
  journalId, 
  journalTitle, 
  journalDescription = '', 
  onUpdate 
}) => {
  const router = useIonRouter();
  const [title, setTitle] = useState<string>(journalTitle || '');
  const [description, setDescription] = useState<string>(journalDescription || '');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const navigation = useIonRouter();

  useEffect(() => {
    setTitle(journalTitle || '');
    setDescription(journalDescription || '');
  }, [journalTitle, journalDescription]);

  const fetchJournalData = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('title, description')
        .eq('journal_id', journalId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setDescription(data.description || '');
      }
    } catch (error) {
      console.error('Error fetching journal data:', error);
      setToastMessage('Failed to load journal data');
      setShowToast(true);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddPage = () => {
    router.push(`/app/JournalPage/${journalId}`);
  };

  const handleOpenSettings = async () => {
    // Choose one approach:
    
    // 1. Use the props directly (faster, but might not be fresh)
    setTitle(journalTitle || '');
    setDescription(journalDescription || '');
    
    // 2. Fetch fresh data from Supabase (slower, but guaranteed fresh)
    // await fetchJournalData();
    
    setShowModal(true);
  };

  const handleUpdateJournal = async () => {
    if (!title?.trim()) {
      setToastMessage('Title cannot be empty');
      setShowToast(true);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('journals')
        .update({ 
          title: title.trim(), 
          description: description.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('journal_id', journalId);

      if (error) throw error;

      setToastMessage('Journal updated successfully');
      setShowToast(true);
      
      if (onUpdate) {
        onUpdate();
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error updating journal:', error);
      setToastMessage('Failed to update journal');
      setShowToast(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteJournal = async () => {
    try {
      // 1. First delete all associated files from storage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // List all files in the journal's folder
        const { data: files, error: listError } = await supabase.storage
          .from('journal-contents')
          .list(`${user.id}/${journalId}`);
        
        if (listError) throw listError;
  
        // Delete all files if they exist
        if (files && files.length > 0) {
          const filesToDelete = files.map(file => 
            `${user.id}/${journalId}/${file.name}`
          );
          
          const { error: deleteFilesError } = await supabase.storage
            .from('journal-contents')
            .remove(filesToDelete);
  
          if (deleteFilesError) throw deleteFilesError;
        }
  
        // Delete the folder itself (optional)
        await supabase.storage
          .from('journal-contents')
          .remove([`${user.id}/${journalId}`]);
      }
  
      // 2. Get all page IDs for this journal
      const { data: pages, error: pagesError } = await supabase
        .from('journal_pages')
        .select('page_id')
        .eq('journal_id', journalId);
  
      if (pagesError) throw pagesError;
  
      // 3. Delete all page contents (if any pages exist)
      if (pages && pages.length > 0) {
        const pageIds = pages.map(page => page.page_id);
        
        const { error: contentsError } = await supabase
          .from('journal_page_contents')
          .delete()
          .in('page_id', pageIds);
  
        if (contentsError) throw contentsError;
      }
  
      // 4. Delete all pages
      const { error: pagesDeleteError } = await supabase
        .from('journal_pages')
        .delete()
        .eq('journal_id', journalId);
  
      if (pagesDeleteError) throw pagesDeleteError;
  
      // 5. Finally delete the journal itself
      const { error: journalDeleteError } = await supabase
        .from('journals')
        .delete()
        .eq('journal_id', journalId);
  
      if (journalDeleteError) throw journalDeleteError;
  
      // Show success message
      setToastMessage('Journal and all contents deleted successfully');
      setShowToast(true);
      
      // Navigate after a brief delay
      setTimeout(() => {
        router.push('/#/app/journals');
      }, 1000);
      
    } catch (error) {
      console.error('Error deleting journal:', error);
      setToastMessage('Failed to delete journal. Please try again.');
      setShowToast(true);
    } finally {
      navigation.push('/#/app', 'forward', 'replace');
    }
  };

  return (
    <>
      <IonCard className="overview-main-card">
        <IonCardContent>
          <div className="card-actions-container">
            <IonButton 
              size="small" 
              onClick={handleAddPage}
              className="action-button"
            >
              <IonIcon slot="start" icon={add} />
              Add Page
            </IonButton>

            <IonButton 
              size="small" 
              color="medium" 
              onClick={handleOpenSettings}
              className="action-button"
              disabled={isFetching}
            >
              <IonIcon slot="start" icon={settings} />
              {isFetching ? 'Loading...' : 'Settings'}
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Settings Modal */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon slot="icon-only" icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>Journal Settings</IonTitle>
            <IonButtons slot="end">
              <IonButton 
                color="danger" 
                onClick={() => setShowDeleteAlert(true)}
                disabled={isUpdating}
              >
                <IonIcon slot="icon-only" icon={trash} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">Title *</IonLabel>
            <IonInput
              value={title}
              onIonChange={(e) => setTitle(e.detail.value ?? '')}
              placeholder="Enter new journal title"
              clearInput
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea
              value={description}
              onIonChange={(e) => setDescription(e.detail.value ?? '')}
              placeholder="Enter new journal description"
              rows={4}
              autoGrow
            />
          </IonItem>

          <div className="ion-padding-top">
            <IonButton 
              expand="block" 
              onClick={handleUpdateJournal}
              disabled={!title?.trim() || isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={'Delete Journal'}
        message={'Are you sure you want to delete this journal? All pages will be permanently deleted.'}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete',
            handler: handleDeleteJournal
          }
        ]}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
      />
    </>
  );
};

export default OverViewcard;