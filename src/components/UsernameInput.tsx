import React from 'react';
import { IonCol, IonGrid, IonInput, IonRow } from '@ionic/react';

interface Props {
  username: string;
  setUsername: (val: string) => void;
}

const UsernameInput: React.FC<Props> = ({ username, setUsername }) => (
  <IonGrid>
    <IonRow>
      <IonCol>
        <IonInput
          label="Username"
          type="text"
          labelPlacement="floating"
          fill="outline"
          placeholder="Enter username"
          value={username}
          onIonChange={(e) => setUsername(e.detail.value!)}
        />
      </IonCol>
    </IonRow>
  </IonGrid>
);

export default UsernameInput;
