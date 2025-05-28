import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  useIonRouter,
  useIonToast,
} from '@ionic/react';
import { list } from 'ionicons/icons';

interface OverviewSideCardProps {
  journalId: string | undefined;
}

const OverviewSideCard: React.FC<OverviewSideCardProps> = ({ journalId }) => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();

  console.log('OverviewSideCard received journalId:', journalId); // Debug log

  const handleViewPageList = async () => {
    console.log('Page List button clicked with journalId:', journalId); // Debug log
    
    if (!journalId) {
      console.error('No journalId provided to OverviewSideCard'); // Error log
      await presentToast({
        message: 'Journal ID is missing! Cannot navigate.',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      return;
    }

    const targetPath = `/#/app/page-list/${journalId}`;
    console.log('Attempting to navigate to:', targetPath); // Debug log
    
    router.push(targetPath);
  };

  return (
    <IonCard className="overview-side-card">
      <IonCardContent>
        <h2>Journal Navigation</h2>
        <IonButton 
          expand="block" 
          fill="outline"
          onClick={handleViewPageList}
          disabled={!journalId}
          style={{ zIndex: 10 }}
        >
          <IonIcon icon={list} slot="start" />
          Page List
        </IonButton>

        
      </IonCardContent>
    </IonCard>
  );
};

export default OverviewSideCard;