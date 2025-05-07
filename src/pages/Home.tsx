import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonRouterOutlet } from '@ionic/react';
import Profile from '../components/home_components/profile';
import Searchbar from '../components/home_components/SearchBar';
import NewButton from '../components/home_components/NewButton';
import JournalCards from '../components/home_components/JournalCards';
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
                    <NewButton />
                </div>
                <JournalCards />
            </IonContent>

        </IonPage>
    );
};

export default Home;