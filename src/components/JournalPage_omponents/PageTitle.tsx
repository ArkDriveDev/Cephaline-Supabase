import React, { useState } from 'react';
import { IonInput, IonItem } from '@ionic/react';

interface PageTitleProps {
  onTitleChange: (title: string) => void;
}

const PageTitle: React.FC<PageTitleProps> = ({ onTitleChange }) => {
  const [title, setTitle] = useState('');

  const handleTitleChange = (value: string) => {
    setTitle(value);
    onTitleChange(value);
  };

  return (
    <IonItem lines="none" style={{ width: '700px', margin: '30px', marginTop: '60px' }}>
      <IonInput
        value={title}
        placeholder="Enter page title"
        onIonChange={(e) => handleTitleChange(e.detail.value!)}
        clearInput
      />
    </IonItem>
  );
};

export default PageTitle;