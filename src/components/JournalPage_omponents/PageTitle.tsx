// src/components/PageTitle.tsx

import React, { useState } from 'react';
import { IonInput, IonItem, IonLabel } from '@ionic/react';

const PageTitle: React.FC = () => {
  const [title, setTitle] = useState('');

  return (
    <IonItem>
      <IonLabel position="floating">Page Title</IonLabel>
      <IonInput
        value={title}
        placeholder="Enter page title"
        onIonChange={(e) => setTitle(e.detail.value!)}
        clearInput
      />
    </IonItem>
  );
};

export default PageTitle;
