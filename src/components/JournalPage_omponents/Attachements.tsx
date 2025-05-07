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

interface Attachment {
  type: string;
  content: string;
}

const Attachments: React.FC<{ onAttach: (attachment: Attachment) => void }> = ({ onAttach }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const handleIconClick = (id: string) => {
    switch(id) {
      case 'link':
        setShowLinkModal(true);
        break;
      case 'image':
        setShowImageModal(true);
        break;
      case 'file':
        setShowFileModal(true);
        break;
      case 'folder':
        setShowFolderModal(true);
        break;
      default:
        break;
    }
  };

  const handleSubmitLink = () => {
    if (linkUrl.trim()) {
      // Add http:// if not present
      let formattedUrl = linkUrl;
      if (!/^https?:\/\//i.test(linkUrl)) {
        formattedUrl = 'http://' + linkUrl;
      }
      
      onAttach({
        type: 'link',
        content: formattedUrl
      });
      setShowLinkModal(false);
      setLinkUrl('');
    }
  };

  const handleCloseModal = () => {
    setShowLinkModal(false);
    setShowImageModal(false);
    setShowFileModal(false);
    setShowFolderModal(false);
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
                onClick={() => handleIconClick(id)}
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
            placeholder="Enter URL (e.g., example.com)"
            onIonChange={(e) => setLinkUrl(e.detail.value!)}
            style={{ marginBottom: '16px' }}
          />
          <IonButton expand="block" onClick={handleSubmitLink}>
            Attach
          </IonButton>
        </IonContent>
      </IonModal>

      {/* Image Modal */}
      <IonModal
        isOpen={showImageModal}
        onDidDismiss={handleCloseModal}
        style={{
          '--height': '40%',
          '--border-radius': '16px',
          '--box-shadow': '0 4px 16px rgba(0,0,0,0.12)'
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Attach Image</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleCloseModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '16px',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <IonIcon 
                icon={imageOutline} 
                size="large" 
                style={{ marginBottom: '8px' }} 
              />
              <p>Drag and drop images here or</p>
              <IonButton 
                fill="outline" 
                style={{ marginTop: '8px' }}
                onClick={() => console.log('Select image clicked')}
              >
                Select from device
              </IonButton>
            </div>
            <IonButton expand="block" onClick={() => console.log('Attach image functionality')}>
              Attach Image
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* File Modal */}
      <IonModal
        isOpen={showFileModal}
        onDidDismiss={handleCloseModal}
        style={{
          '--height': '50%',
          '--border-radius': '16px',
          '--box-shadow': '0 4px 16px rgba(0,0,0,0.12)'
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Attach File</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleCloseModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '16px',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <IonIcon 
                icon={documentAttachOutline} 
                size="large" 
                style={{ marginBottom: '8px' }} 
              />
              <p>Drag and drop files here or</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <IonButton 
                  fill="outline" 
                  style={{ marginTop: '8px' }}
                  onClick={() => console.log('Select document clicked')}
                >
                  Documents
                </IonButton>
                <IonButton 
                  fill="outline" 
                  style={{ marginTop: '8px' }}
                  onClick={() => console.log('Select PDF clicked')}
                >
                  PDFs
                </IonButton>
                <IonButton 
                  fill="outline" 
                  style={{ marginTop: '8px' }}
                  onClick={() => console.log('Select other file clicked')}
                >
                  Other Files
                </IonButton>
              </div>
            </div>
            <IonButton expand="block" onClick={() => console.log('Attach file functionality')}>
              Attach File
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* Folder Modal */}
      <IonModal
        isOpen={showFolderModal}
        onDidDismiss={handleCloseModal}
        style={{
          '--height': '50%',
          '--border-radius': '16px',
          '--box-shadow': '0 4px 16px rgba(0,0,0,0.12)'
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Attach Folder</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleCloseModal}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '16px',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <IonIcon 
                icon={folderOpenOutline} 
                size="large" 
                style={{ marginBottom: '8px' }} 
              />
              <p>Drag and drop folders here or</p>
              <IonButton 
                fill="outline" 
                style={{ marginTop: '8px' }}
                onClick={() => console.log('Select folder clicked')}
              >
                Select Folder
              </IonButton>
            </div>
            <IonButton expand="block" onClick={() => console.log('Attach folder functionality')}>
              Attach Folder
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default Attachments;