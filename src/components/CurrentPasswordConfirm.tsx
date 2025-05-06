import React from 'react';
import { IonCol, IonGrid, IonInput, IonRow, IonText, IonInputPasswordToggle } from '@ionic/react';

interface Props {
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
}

const CurrentPasswordConfirm: React.FC<Props> = ({ currentPassword, setCurrentPassword }) => (
  <IonGrid>
    <IonRow>
      <IonText color="secondary"><h3>Confirm Changes</h3></IonText>
      <IonCol size="12">
        <IonInput
          label="Current Password"
          type="password"
          labelPlacement="floating"
          fill="outline"
          placeholder="Enter Current Password to Save Changes"
          value={currentPassword}
          onIonChange={(e) => setCurrentPassword(e.detail.value!)}
        >
          <IonInputPasswordToggle slot="end" />
        </IonInput>
      </IonCol>
    </IonRow>
  </IonGrid>
);

export default CurrentPasswordConfirm;
