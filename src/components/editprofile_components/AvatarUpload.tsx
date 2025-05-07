import React, { useRef } from 'react';
import { IonAvatar, IonButton, IonCol, IonGrid, IonImg, IonRow } from '@ionic/react';

interface AvatarUploadProps {
  avatarPreview: string | null;
  handleAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ avatarPreview, handleAvatarChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <IonGrid>
      <IonRow className="ion-justify-content-center ion-align-items-center">
        <IonCol className="ion-text-center">
          {avatarPreview && (
            <IonAvatar style={{ width: '200px', height: '200px', margin: '10px auto' }}>
              <IonImg src={avatarPreview} style={{ objectFit: 'cover' }} />
            </IonAvatar>
          )}

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleAvatarChange}
          />

          <IonButton expand="block" onClick={() => fileInputRef.current?.click()}>
            Upload Avatar
          </IonButton>
        </IonCol>
      </IonRow>
    </IonGrid>
  );
};

export default AvatarUpload;