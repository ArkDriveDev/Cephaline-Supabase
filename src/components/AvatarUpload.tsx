import React from 'react';
import { IonAvatar, IonButton, IonCol, IonGrid, IonImg, IonRow } from '@ionic/react';

interface Props {
  avatarPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUploader: React.FC<Props> = ({ avatarPreview, fileInputRef, handleAvatarChange }) => (
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

export default AvatarUploader;
