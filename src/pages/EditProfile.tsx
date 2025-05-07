import {
    IonButtons,
    IonContent,
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import AvatarUploader from '../components/AvatarUploader';
import React, { useRef, useState } from 'react';  

const EditProfile: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement| null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <AvatarUploader
      avatarPreview={avatarPreview}
      fileInputRef={fileInputRef}  
      handleAvatarChange={handleAvatarChange}
    />
  );
};

export default EditProfile;