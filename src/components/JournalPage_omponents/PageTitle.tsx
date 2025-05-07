import React, { useState } from 'react';
import { IonInput, IonItem} from '@ionic/react';

const PageTitle: React.FC = () => {
  const [title, setTitle] = useState('');

  return (
    <IonItem lines="none" style={{ width: '700px',margin:'30px',marginTop:'60px'}}>
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
