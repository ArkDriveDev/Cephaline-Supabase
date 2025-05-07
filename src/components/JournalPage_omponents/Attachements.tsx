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
  folderOpenOutline,
  closeOutline,
  documentTextOutline
} from 'ionicons/icons';

declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string | boolean;
    directory?: string | boolean;
    mozdirectory?: string | boolean;
  }
}

const icons = [
  { id: 'link', icon: linkOutline, label: 'Attach Link' },
  { id: 'image', icon: imageOutline, label: 'Attach Image' },
  { id: 'file', icon: documentAttachOutline, label: 'Attach File' },
  { id: 'folder', icon: folderOpenOutline, label: 'Attach Folder' }
];

interface Attachment {
  type: 'link' | 'image' | 'file' | 'folder';
  content: string;
  file?: File;
  files?: File[];
}

const Attachments: React.FC<{ onAttach: (attachment: Attachment) => void }> = ({ onAttach }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFolderFiles, setSelectedFolderFiles] = useState<File[]>([]);

  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFolderFiles(Array.from(files));
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
        content: `[${formattedUrl}](${formattedUrl})` // Markdown format
      });
      setShowLinkModal(false);
      setLinkUrl('');
    }
  };

  const handleAttachImage = () => {
    if (selectedImage) {
      onAttach({
        type: 'image',
        content: `![Image](${selectedImage})` // Markdown format
      });
      setSelectedImage(null);
      setShowImageModal(false);
    }
  };

  const handleAttachFile = () => {
    if (selectedFile) {
      onAttach({
        type: 'file',
        content: `[File: ${selectedFile.name}]`, // Markdown format
        file: selectedFile
      });
      setSelectedFile(null);
      setShowFileModal(false);
    }
  };

  const handleAttachFolder = () => {
    if (selectedFolderFiles.length > 0) {
      const folderPath = selectedFolderFiles[0].webkitRelativePath;
      const folderName = folderPath.split('/')[0];
      
      onAttach({
        type: 'folder',
        content: `[Folder: ${folderName}]`, // Markdown format
        files: selectedFolderFiles
      });
      setSelectedFolderFiles([]);
      setShowFolderModal(false);
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
    setSelectedFolderFiles([]);
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
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <IonIcon
                icon={icon}
                size="large"
                onClick={() => handleIconClick(id)}
                style={{ cursor: 'pointer', padding: '4px' }}
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
          />
          <IonButton expand="block" onClick={handleSubmitLink}>
            Attach Link
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
                  src={selectedImage}
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
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Image
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

      {/* File Modal */}
      <IonModal isOpen={showFileModal} onDidDismiss={handleCloseModal}>
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
                    <p>Drag and drop documents here or</p>
                  </IonText>
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
      <IonModal isOpen={showFolderModal} onDidDismiss={handleCloseModal}>
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
              justifyContent: selectedFolderFiles.length > 0 ? 'flex-start' : 'center',
              alignItems: 'center',
              minHeight: '200px',
              overflowY: 'auto'
            }}>
              {selectedFolderFiles.length > 0 ? (
                <div style={{ width: '100%' }}>
                  <IonText>
                    <h3 style={{ marginBottom: '16px' }}>
                      {selectedFolderFiles[0].webkitRelativePath.split('/')[0]} 
                      <span style={{ color: 'var(--ion-color-medium)' }}> ({selectedFolderFiles.length} files)</span>
                    </h3>
                  </IonText>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedFolderFiles.map((file, index) => (
                      <IonItem key={index} lines="none">
                        <IonIcon 
                          icon={documentAttachOutline} 
                          slot="start"
                          color="medium"
                        />
                        <IonLabel>
                          <p style={{ fontSize: '14px' }}>
                            {file.webkitRelativePath.split('/').slice(1).join('/')}
                          </p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <IonIcon
                    icon={folderOpenOutline}
                    size="large"
                    style={{ marginBottom: '8px', color: 'var(--ion-color-medium)' }}
                  />
                  <IonText color="medium">
                    <p>Drag and drop folders here or</p>
                  </IonText>
                  <IonButton
                    fill="outline"
                    style={{ marginTop: '8px' }}
                    onClick={() => folderInputRef.current?.click()}
                  >
                    Select Folder
                  </IonButton>
                  <input
                    type="file"
                    ref={folderInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFolderChange}
                    webkitdirectory=""
                    multiple
                  />
                </>
              )}
            </div>
            <IonButton 
              expand="block" 
              onClick={handleAttachFolder}
              disabled={selectedFolderFiles.length === 0}
            >
              Attach Folder
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default Attachments;