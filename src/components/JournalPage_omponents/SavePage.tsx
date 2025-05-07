import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { saveOutline } from 'ionicons/icons';

const SavePage: React.FC = () => {
  const handleSave = () => {
    console.log('Page saved!');
    // Add your save logic here
  };

  return (
    <IonButton onClick={handleSave}>
      <IonIcon icon={saveOutline} slot="start" />
      Save Page
    </IonButton>
  );
};

export default SavePage;
