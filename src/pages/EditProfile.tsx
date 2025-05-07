import React from 'react';
import { IonCol, IonGrid, IonInput, IonRow, IonText } from '@ionic/react';
import { IonInputPasswordToggle } from '@ionic/react';

interface PasswordChangeFormProps {
  password: string;
  confirmPassword: string;
  currentPassword: string;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  setCurrentPassword: (value: string) => void;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  password,
  confirmPassword,
  currentPassword,
  setPassword,
  setConfirmPassword,
  setCurrentPassword,
}) => {
  return (
    <>
      <IonGrid>
        <IonRow>
          <IonText color="secondary">
            <h3>Change Password</h3>
          </IonText>
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
        </IonRow>
      </IonGrid>

      <IonGrid>
        <IonRow>
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

      <IonGrid>
        <IonRow>
          <IonText color="secondary">
            <h3>Confirm Changes</h3>
          </IonText>
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
    </>
  );
};

export default PasswordChangeForm;