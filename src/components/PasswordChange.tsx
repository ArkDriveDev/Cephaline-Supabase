import React from 'react';
import { IonCol, IonGrid, IonInput, IonRow, IonText, IonInputPasswordToggle } from '@ionic/react';

interface Props {
  password: string;
  confirmPassword: string;
  setPassword: (val: string) => void;
  setConfirmPassword: (val: string) => void;
}

const PasswordChange: React.FC<Props> = ({ password, confirmPassword, setPassword, setConfirmPassword }) => (
  <IonGrid>
    <IonRow>
      <IonText color="secondary"><h3>Change Password</h3></IonText>
      <IonCol size="12">
        <IonInput
          label="New Password"
          type="password"
          labelPlacement="floating"
          fill="outline"
          placeholder="Enter New Password"
          value={password}
          onIonChange={(e) => setPassword(e.detail.value!)}
        >
          <IonInputPasswordToggle slot="end" />
        </IonInput>
      </IonCol>
      <IonCol size="12">
        <IonInput
          label="Confirm Password"
          type="password"
          labelPlacement="floating"
          fill="outline"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onIonChange={(e) => setConfirmPassword(e.detail.value!)}
        >
          <IonInputPasswordToggle slot="end" />
        </IonInput>
      </IonCol>
    </IonRow>
  </IonGrid>
);

export default PasswordChange;
