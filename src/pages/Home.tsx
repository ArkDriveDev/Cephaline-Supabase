import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';
import Profile from '../components/home_components/profile';
import Searchbar from '../components/home_components/SearchBar';
import NewButton from '../components/home_components/NewButton';
import JournalCards from '../components/home_components/JournalCards';

const Home: React.FC = () => {
    const [journals, setJournals] = useState<any[]>([]);

    // This function will be called when a new journal is created
    const handleJournalCreated = (newJournal: any) => {
        setJournals(prevJournals => [newJournal, ...prevJournals]);
    };

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
                    <NewButton onJournalCreated={handleJournalCreated} />
                </div>
                <JournalCards journals={journals} setJournals={setJournals} />
            </IonContent>
        </IonPage>
    );
};

export default Home;