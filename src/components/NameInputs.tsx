import React from 'react';
import { IonCol, IonGrid, IonInput, IonRow } from '@ionic/react';

interface Props {
  firstName: string;
  lastName: string;
  setFirstName: (val: string) => void;
  setLastName: (val: string) => void;
}

const NameInputs: React.FC<Props> = ({ firstName, lastName, setFirstName, setLastName }) => (
  <IonGrid>
    <IonRow>
      <IonCol size="6">
        <IonInput
          label="First Name"
          type="text"
          labelPlacement="floating"
          fill="outline"
          placeholder="Enter First Name"
          value={firstName}
          onIonChange={(e) => setFirstName(e.detail.value!)}
        />
      </IonCol>
      <IonCol size="6">
        <IonInput
          label="Last Name"
          type="text"
          labelPlacement="floating"
          fill="outline"
          placeholder="Enter Last Name"
          value={lastName}
          onIonChange={(e) => setLastName(e.detail.value!)}
        />
      </IonCol>
    </IonRow>
  </IonGrid>
);

export default NameInputs;
