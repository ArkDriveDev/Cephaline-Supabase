import React from 'react';
import { IonCol, IonGrid, IonInput, IonRow } from '@ionic/react';

interface PersonalInfoFormProps {
  username: string;
  firstName: string;
  lastName: string;
  setUsername: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  username,
  firstName,
  lastName,
  setUsername,
  setFirstName,
  setLastName,
}) => {
  return (
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
};

export default PersonalInfoForm;