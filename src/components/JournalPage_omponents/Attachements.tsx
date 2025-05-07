import React, { useState } from 'react';
import { IonIcon, IonRow, IonCol, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonButtons } from '@ionic/react';
import {
  linkOutline,
  imageOutline,
  documentAttachOutline,
  folderOpenOutline,
  closeOutline
} from 'ionicons/icons';

const icons = [
  { id: 'link', icon: linkOutline, label: 'Attach Link' },
  { id: 'image', icon: imageOutline, label: 'Attach Image' },
  { id: 'file', icon: documentAttachOutline, label: 'Attach File' },
  { id: 'folder', icon: folderOpenOutline, label: 'Attach Folder' }
];

const Attachments: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const handleLinkClick = () => {
    setShowLinkModal(true);
  };

  const handleSubmitLink = () => {
    console.log('Submitted link:', linkUrl);
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const handleCloseModal = () => {
    setShowLinkModal(false);
    setLinkUrl('');
  };

  return (
    <>
      <IonRow style={{ justifyContent: 'flex-start', gap: '1px', padding: '8px' }}>
        {icons.map(({ id, icon, label }) => (
          <IonCol size="auto" key={id}>
            <div
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <IonIcon
                icon={icon}
                size="large"
                onClick={() => id === 'link' ? handleLinkClick() : console.log(label)}
                style={{ cursor: 'pointer' }}
              />
              {hovered === id && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#333',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    fontSize: '14px'
                  }}
                >
                  {label}
                </div>
              )}
            </div>
          </IonCol>
        ))}
      </IonRow>

      {/* Link Modal */}
      <IonModal
        isOpen={showLinkModal}
        onDidDismiss={handleCloseModal}
        style={{
          '--height': '25%',
          '--border-radius': '16px',
          '--box-shadow': '0 4px 16px rgba(0,0,0,0.12)'
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Attach Link</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleCloseModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonInput
            value={linkUrl}
            placeholder="Enter URL"
            onIonChange={(e) => setLinkUrl(e.detail.value!)}
            style={{ marginBottom: '16px' }}
          />
          <IonButton expand="block" onClick={handleSubmitLink}>
            Submit
          </IonButton>
        </IonContent>
      </IonModal>
    </>
  );
};

export default Attachments;