import React from 'react';
import { IonButton, IonIcon, useIonRouter } from '@ionic/react';
import { saveOutline } from 'ionicons/icons';

interface SavePageProps {
  onSave: () => Promise<void>;
}

const SavePage: React.FC<SavePageProps> = ({ onSave }) => {
  const handleSave = async () => {
    try {
      await onSave();
      console.log('Page saved successfully!');
    } catch (error) {
      console.error('Error saving page:', error);
    }
  };

  return (
    <IonButton onClick={handleSave}>
      <IonIcon icon={saveOutline} slot="start" />
      Save Page
    </IonButton>
  );
};

export default SavePage;