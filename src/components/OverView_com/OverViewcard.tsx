import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  useIonRouter,
} from '@ionic/react';
import { add, settings } from 'ionicons/icons';

interface OverViewcardProps {
  journalId: string;
}

const OverViewcard: React.FC<OverViewcardProps> = ({ journalId }) => {
  const router = useIonRouter();

  const handleAddPage = () => {
    router.push(`/cephaline-supabase/app/JournalPage/${journalId}`);
  };

  const handleOpenSettings = () => {
    router.push(`/cephaline-supabase/app/journal-settings/${journalId}`);
  };

  return (
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
  );
};

export default OverViewcard;