import React, { useState } from 'react';
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
  onUpdate?: () => void; // Made optional
}

const OverViewcard: React.FC<OverViewcardProps> = ({ 
  journalId, 
  journalTitle, 
  journalDescription, 
  onUpdate 
}) => {
  const router = useIonRouter();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState(journalTitle);
  const [description, setDescription] = useState(journalDescription || '');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleAddPage = () => {
    router.push(`/Cephaline-Supabase/app/JournalPage/${journalId}`);
  };

  const handleOpenSettings = () => {
    setShowModal(true);
  };

  const handleUpdateJournal = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('journals')
        .update({ 
          title, 
          description,
          updated_at: new Date().toISOString()
        })
        .eq('journal_id', journalId);

      if (error) throw error;

      setToastMessage('Journal updated successfully');
      setShowToast(true);
      
      // Only call if provided
      if (onUpdate) {
        onUpdate();
      }
      setShowModal(false);
    } catch (error) {
      setToastMessage('Failed to update journal');
      setShowToast(true);
      console.error('Error updating journal:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteJournal = async () => {
    try {
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('journal_id', journalId);

      if (error) throw error;

      setToastMessage('Journal deleted successfully');
      setShowToast(true);
      
      // Redirect after a short delay to show the toast
      setTimeout(() => {
        router.push('/Cephaline-Supabase/app/journals');
      }, 1000);
    } catch (error) {
      setToastMessage('Failed to delete journal');
      setShowToast(true);
      console.error('Error deleting journal:', error);
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
            >
              <IonIcon slot="start" icon={settings} />
              Settings
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
              >
                <IonIcon slot="icon-only" icon={trash} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">Title</IonLabel>
            <IonInput
              value={title}
              onIonChange={(e) => setTitle(e.detail.value!)}
              placeholder="Enter journal title"
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea
              value={description}
              onIonChange={(e) => setDescription(e.detail.value!)}
              placeholder="Enter journal description"
              rows={4}
              autoGrow
            />
          </IonItem>

          <div className="ion-padding-top">
            <IonButton 
              expand="block" 
              onClick={handleUpdateJournal}
              disabled={!title || isUpdating}
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

      {/* Toast for feedback */}
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