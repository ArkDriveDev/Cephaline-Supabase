import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import Profile from '../components/profile';
import Searchbar from '../components/SearchBar';
const Home: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Journals</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <Profile />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Searchbar />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Home;