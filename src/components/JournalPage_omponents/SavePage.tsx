import React from 'react';
import { IonButton, IonSpinner } from '@ionic/react';

interface SavePageProps {
  onSave: () => void;
  disabled: boolean;
  loading: boolean;  // Add this prop
}

const SavePage: React.FC<SavePageProps> = ({ onSave, disabled, loading }) => {
  return (
    <IonButton 
      onClick={onSave} 
      disabled={disabled || loading}
      expand="block"
    >
      {loading ? (
        <>
          <IonSpinner name="crescent" />
          Saving...
        </>
      ) : (
        'Save Page'
      )}
    </IonButton>
  );
};

export default SavePage;