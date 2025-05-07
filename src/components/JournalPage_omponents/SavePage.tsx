import React from 'react';
import { IonButton, IonIcon, useIonRouter, useIonToast } from '@ionic/react';
import { saveOutline } from 'ionicons/icons';

interface SavePageProps {
  onSave: () => Promise<void>;
  disabled?: boolean;
}

const SavePage: React.FC<SavePageProps> = ({ onSave, disabled = false }) => {
  const [present] = useIonToast();
  const router = useIonRouter();

  const handleSave = async () => {
    try {
      await onSave();
      await present({
        message: 'Journal saved successfully!',
        duration: 2000,
        color: 'success'
      });
      router.push('/cephaline-supabase/app/home');
    } catch (error) {
      await present({
        message: 'Failed to save journal. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      console.error('Error saving page:', error);
    }
  };

  return (
    <IonButton onClick={handleSave} disabled={disabled}>
      <IonIcon icon={saveOutline} slot="start" />
      Save Page
    </IonButton>
  );
};

export default SavePage;