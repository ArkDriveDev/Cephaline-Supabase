import React, { useState, useRef } from 'react';
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
  { id: 'file', icon: documentAttachOutline, label: 'Attach Document' }, // Changed label to Document
  { id: 'folder', icon: folderOpenOutline, label: 'Attach Folder' }
];

interface Attachment {
  type: string;
  content: string;
  file?: File; // Added file to the interface
}

const Attachments: React.FC<{ onAttach: (attachment: Attachment) => void }> = ({ onAttach }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Allowed document file types
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
      } else if (allowedFileTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid document file (PDF, Word, Excel, PowerPoint, or Text)');
      }
    }
  };

  const handleIconClick = (id: string) => {
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
      case 'folder':
        setShowFolderModal(true);
        break;
      default:
        break;
    }
  };

  const handleSubmitLink = () => {
    if (linkUrl.trim()) {
      let formattedUrl = linkUrl;
      if (!/^https?:\/\//i.test(linkUrl)) {
        formattedUrl = 'http://' + linkUrl;
      }

      onAttach({
        type: 'link',
        content: `[Link](${formattedUrl})`
      });
      setShowLinkModal(false);
      setLinkUrl('');
    }
  };

  const handleAttachImage = () => {
    if (selectedImage) {
      onAttach({
        type: 'image',
        content: `![Image](${selectedImage})`
      });
      setSelectedImage(null);
      setShowImageModal(false);
    }
  };

  const handleAttachFile = () => {
    if (selectedFile) {
      onAttach({
        type: 'file',
        content: `[Document: ${selectedFile.name}]`,
        file: selectedFile
      });
      setSelectedFile(null);
      setShowFileModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowLinkModal(false);
    setShowImageModal(false);
    setShowFileModal(false);
    setShowFolderModal(false);
    setLinkUrl('');
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'assets/icon/pdf-icon.png';
      case 'doc':
      case 'docx':
        return 'assets/icon/word-icon.png';
      case 'xls':
      case 'xlsx':
        return 'assets/icon/excel-icon.png';
      case 'ppt':
      case 'pptx':
        return 'assets/icon/powerpoint-icon.png';
      case 'txt':
        return 'assets/icon/text-icon.png';
      default:
        return 'assets/icon/file-icon.png';
    }
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
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                />
              ) : (
                <>
                  <IonIcon
                    icon={imageOutline}
                    size="large"
                    style={{ marginBottom: '8px' }}
                  />
                  <p>Drag and drop images here or</p>
                  <IonButton
                    fill="outline"
                    style={{ marginTop: '8px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select from device
                  </IonButton>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>

            <IonButton 
              expand="block" 
              onClick={handleAttachImage}
              disabled={!selectedImage}
            >
              Attach Image
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      {/* File Modal - Updated for documents */}
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
            <IonTitle>Attach Document</IonTitle>
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
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {selectedFile ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={getFileIcon(selectedFile.name)} 
                    alt="File type" 
                    style={{ width: '64px', height: '64px', marginBottom: '16px' }}
                  />
                  <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{selectedFile.name}</p>
                  <p style={{ color: '#666' }}>{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <>
                  <IonIcon
                    icon={documentAttachOutline}
                    size="large"
                    style={{ marginBottom: '8px' }}
                  />
                  <p>Drag and drop documents here or</p>
                  <IonButton
                    fill="outline"
                    style={{ marginTop: '8px' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Document
                  </IonButton>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                </>
              )}
            </div>
            <IonButton 
              expand="block" 
              onClick={handleAttachFile}
              disabled={!selectedFile}
            >
              Attach Document
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