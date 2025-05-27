import React, { useState, useRef } from 'react';
import { 
  IonIcon, IonRow, IonCol, IonModal, IonHeader, IonToolbar, 
  IonTitle, IonContent, IonButton, IonInput, IonButtons, 
  IonItem, IonLabel, IonThumbnail, IonText 
} from '@ionic/react';
import {
  linkOutline,
  imageOutline,
  documentAttachOutline,
  closeOutline,
  documentTextOutline
} from 'ionicons/icons';

interface Attachment {
  type: 'link' | 'image' | 'file';
  content: string | File;
}

interface AttachmentsProps {
  onAttach: (attachment: Attachment) => void;
  isUploading: boolean;
}

const Attachments: React.FC<AttachmentsProps> = ({ onAttach, isUploading }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const icons = [
    { id: 'link', icon: linkOutline, label: 'Attach Link' },
    { id: 'image', icon: imageOutline, label: 'Attach Image' },
    { id: 'file', icon: documentAttachOutline, label: 'Attach File' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;
    
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleIconClick = (id: string) => {
    if (isUploading) return;
    
    switch (id) {
      case 'link':
        setShowLinkModal(true);
        break;
      case 'image':
        setShowImageModal(true);
        break;
      case 'file':
        setShowFileModal(true);
        break;
      default:
        break;
    }
  };

  const handleSubmitLink = () => {
    if (isUploading || !linkUrl.trim()) return;
    
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
  };

  const handleAttachImage = () => {
    if (isUploading || !selectedImage) return;
    
    onAttach({
      type: 'image',
      content: selectedImage
    });
    setSelectedImage(null);
    setShowImageModal(false);
  };

  const handleAttachFile = () => {
    if (isUploading || !selectedFile) return;
    
    onAttach({
      type: 'file',
      content: selectedFile
    });
    setSelectedFile(null);
    setShowFileModal(false);
  };

  const handleCloseModal = () => {
    setShowLinkModal(false);
    setShowImageModal(false);
    setShowFileModal(false);
    setLinkUrl('');
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <IonIcon icon={documentTextOutline} color="danger" />;
      case 'doc':
      case 'docx':
        return <IonIcon icon={documentTextOutline} color="primary" />;
      case 'xls':
      case 'xlsx':
        return <IonIcon icon={documentTextOutline} color="success" />;
      case 'ppt':
      case 'pptx':
        return <IonIcon icon={documentTextOutline} color="warning" />;
      default:
        return <IonIcon icon={documentTextOutline} />;
    }
  };

  return (
    <>
      <IonRow style={{ justifyContent: 'flex-start', gap: '8px', padding: '8px' }}>
        {icons.map(({ id, icon, label }) => (
          <IonCol size="auto" key={id}>
            <div
              onMouseEnter={() => !isUploading && setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              style={{ 
                position: 'relative', 
                display: 'inline-block',
                opacity: isUploading ? 0.6 : 1
              }}
            >
              <IonIcon
                icon={icon}
                size="large"
                onClick={() => handleIconClick(id)}
                style={{ 
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  padding: '4px'
                }}
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
      <IonModal isOpen={showLinkModal} onDidDismiss={handleCloseModal}>
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
            disabled={isUploading}
          />
          <IonButton 
            expand="block" 
            onClick={handleSubmitLink}
            disabled={isUploading || !linkUrl.trim()}
          >
            {isUploading ? 'Uploading...' : 'Attach Link'}
          </IonButton>
        </IonContent>
      </IonModal>

      {/* Image Modal */}
      <IonModal isOpen={showImageModal} onDidDismiss={handleCloseModal}>
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
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              border: '2px dashed var(--ion-color-medium)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '16px',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px'
            }}>
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                />
              ) : (
                <>
                  <IonIcon
                    icon={imageOutline}
                    size="large"
                    style={{ marginBottom: '8px', color: 'var(--ion-color-medium)' }}
                  />
                  <IonText color="medium">
                    <p>Drag and drop images here or</p>
                  </IonText>
                  <IonButton
                    fill="outline"
                    style={{ marginTop: '8px' }}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Select Image
                  </IonButton>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </>
              )}
            </div>
            <IonButton 
              expand="block" 
              onClick={handleAttachImage}
              disabled={isUploading || !selectedImage}
            >
              {isUploading ? 'Uploading...' : 'Attach Image'}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* File Modal */}
      <IonModal isOpen={showFileModal} onDidDismiss={handleCloseModal}>
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
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              border: '2px dashed var(--ion-color-medium)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '16px',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px'
            }}>
              {selectedFile ? (
                <IonItem lines="none" style={{ width: '100%' }}>
                  <IonThumbnail slot="start">
                    {getFileIcon(selectedFile.name)}
                  </IonThumbnail>
                  <IonLabel>
                    <h3>{selectedFile.name}</h3>
                    <p>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </IonLabel>
                </IonItem>
              ) : (
                <>
                  <IonIcon
                    icon={documentAttachOutline}
                    size="large"
                    style={{ marginBottom: '8px', color: 'var(--ion-color-medium)' }}
                  />
                  <IonText color="medium">
                    <p>Drag and drop files here or</p>
                  </IonText>
                  <IonButton
                    fill="outline"
                    style={{ marginTop: '8px' }}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Select File
                  </IonButton>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </>
              )}
            </div>
            <IonButton 
              expand="block" 
              onClick={handleAttachFile}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? 'Uploading...' : 'Attach File'}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default Attachments;