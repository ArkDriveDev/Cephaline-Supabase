import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';
import Profile from '../components/home_components/profile';
import Searchbar from '../components/home_components/SearchBar';
import NewButton from '../components/home_components/NewButton';
import JournalCards from '../components/home_components/JournalCards';

const Home: React.FC = () => {
    const [journals, setJournals] = useState<any[]>([]);
    const [searchText, setSearchText] = useState(''); // <-- Add this

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
                    <Searchbar value={searchText} onChange={setSearchText} />
                    <NewButton onJournalCreated={handleJournalCreated} />
                </div>
                <JournalCards
                    journals={journals}
                    setJournals={setJournals}
                    searchText={searchText}
                />
            </IonContent>
        </IonPage>
    );
};
export default Home;