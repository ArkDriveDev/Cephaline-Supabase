import React from 'react';
import { IonAvatar, IonItem, IonLabel,IonImg} from '@ionic/react';

const Profile: React.FC = () => {
  return (
    <IonItem>
     <IonAvatar style={{ width: '200px', height: '200px', margin: '10px auto' }}>
                    <IonImg src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwUjiUutJvuQ0vQfeBInl1_0akbZphNjTcA&s' style={{ objectFit: 'cover' }} />
                  </IonAvatar>
      <IonLabel>
        <h2>Profile</h2>
        <p>Developer</p>
      </IonLabel>
    </IonItem>
  );
};

export default Profile