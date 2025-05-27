import React, { useState } from 'react';
import { 
  IonButton, 
  IonIcon, 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonInput, 
  IonTextarea, 
  IonItem, 
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonAlert
} from '@ionic/react';
import { bookOutline, close} from 'ionicons/icons';
import { supabase } from '../../utils/supaBaseClient';

interface NewJournalData {
  journal_id?: string;
  user_id: string;
  title: string;
  description: string;
  title_color: string;
  description_color: string;
  card_color: string;
  created_at?: string;
}

interface NewButtonProps {
  onJournalCreated?: (journal: NewJournalData) => void;
}

const NewButton: React.FC<NewButtonProps> = ({ onJournalCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalDescription, setJournalDescription] = useState('');
  const [titleColor, setTitleColor] = useState('#3880ff');
  const [descriptionColor, setDescriptionColor] = useState('#555555');
  const [cardColor, setCardColor] = useState('#ffffff');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const colorOptions = [
    { value: '#3880ff', name: 'Primary Blue' },
    { value: '#3dc2ff', name: 'Light Blue' },
    { value: '#2dd36f', name: 'Success Green' },
    { value: '#ffc409', name: 'Warning Yellow' },
    { value: '#eb445a', name: 'Danger Red' },
    { value: '#92949c', name: 'Medium Gray' },
    { value: '#555555', name: 'Dark Gray' },
    { value: '#000000', name: 'Black' },
    { value: '#ffffff', name: 'White' },
    { value: '#fff8e1', name: 'Warm White' },
    { value: '#f5f5f5', name: 'Light Gray' }
  ];

  const handleSave = async () => {
    if (!journalTitle.trim()) {
      setAlertMessage('Journal title is required');
      setShowAlert(true);
      return;
    }

    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error(authError?.message || 'User not authenticated');
      }

      // Insert new journal into database
      const { data, error } = await supabase
        .from('journals')
        .insert({
          user_id: user.id,
          title: journalTitle,
          description: journalDescription,
          title_color: titleColor,
          description_color: descriptionColor,
          card_color: cardColor
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Notify parent component about the new journal
      if (onJournalCreated) {
        onJournalCreated(data);
      }

      // Reset form
      setJournalTitle('');
      setJournalDescription('');
      setShowModal(false);
      
    } catch (error) {
      console.error('Error creating journal:', error);
      setAlertMessage(error instanceof Error ? error.message : 'Failed to create journal');
      setShowAlert(true);
    }
  };

  return (
    <>
      {/* Main New Journal Button */}
      <IonButton 
        onClick={() => setShowModal(true)} 
        expand="block" 
        color="primary"
        style={{ margin: '0 10px',width:'100px'}}
      >
        <IonIcon slot="start" icon={bookOutline} />
        New Journal
      </IonButton>

      {/* New Journal Modal */}
      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            <IonTitle>Create New Journal</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleSave} strong>
                Save
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            {/* Journal Title Input */}
            <IonItem>
              <IonLabel position="stacked" color="primary">
                Journal Title <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonInput
                value={journalTitle}
                onIonChange={(e) => setJournalTitle(e.detail.value || '')}
                placeholder="Enter journal title"
                autofocus
                clearOnEdit
              />
            </IonItem>

            {/* Journal Description Input */}
            <IonItem>
              <IonLabel position="stacked" color="primary">
                Description
              </IonLabel>
              <IonTextarea
                value={journalDescription}
                onIonChange={(e) => setJournalDescription(e.detail.value || '')}
                placeholder="Enter journal description"
                rows={6}
                autoGrow
              />
            </IonItem>

            {/* Color Customization Section */}
            <div style={{ marginTop: '20px' }}>
              <IonItem>
                <IonLabel>Title Color</IonLabel>
                <IonSelect 
                  value={titleColor} 
                  onIonChange={e => setTitleColor(e.detail.value)}
                  interface="popover"
                >
                  {colorOptions.map(color => (
                    <IonSelectOption key={color.value} value={color.value}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: color.value,
                          marginRight: '8px',
                          border: '1px solid #ddd'
                        }} />
                        {color.name}
                      </div>
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel>Description Color</IonLabel>
                <IonSelect 
                  value={descriptionColor} 
                  onIonChange={e => setDescriptionColor(e.detail.value)}
                  interface="popover"
                >
                  {colorOptions.map(color => (
                    <IonSelectOption key={color.value} value={color.value}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: color.value,
                          marginRight: '8px',
                          border: '1px solid #ddd'
                        }} />
                        {color.name}
                      </div>
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel>Card Background</IonLabel>
                <IonSelect 
                  value={cardColor} 
                  onIonChange={e => setCardColor(e.detail.value)}
                  interface="popover"
                >
                  {colorOptions.map(color => (
                    <IonSelectOption key={color.value} value={color.value}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: color.value,
                          marginRight: '8px',
                          border: '1px solid #ddd'
                        }} />
                        {color.name}
                      </div>
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </div>

            {/* Preview Section */}
            <div style={{ 
              marginTop: '30px',
              padding: '15px',
              backgroundColor: cardColor,
              borderRadius: '8px',
              borderLeft: '4px solid var(--ion-color-primary)',
              boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: titleColor, margin: '0 0 10px 0' }}>
                {journalTitle || 'Title Preview'}
              </h3>
              <p style={{ 
                color: descriptionColor,
                fontStyle: 'italic',
                margin: '8px 0'
              }}>
                {journalDescription || 'Description preview text goes here...'}
              </p>
              <small style={{ 
                color: '#888',
                display: 'block',
                textAlign: 'right'
              }}>
                Created: Just now
              </small>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Error Alert */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Error"
        message={alertMessage}
        buttons={['OK']}
      />
    </>
  );
};

export default NewButton;