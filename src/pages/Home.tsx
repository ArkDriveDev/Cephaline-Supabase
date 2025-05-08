import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';
import Profile from '../components/home_components/profile';
import Searchbar from '../components/home_components/SearchBar';
import NewButton from '../components/home_components/NewButton';
import JournalCards from '../components/home_components/JournalCards';

const Home: React.FC = () => {
    const [journals, setJournals] = useState<any[]>([]);
    const [filteredJournals, setFilteredJournals] = useState<any[]>([]);

    const handleJournalCreated = (newJournal: any) => {
        setJournals(prev => [newJournal, ...prev]);
        setFilteredJournals(prev => [newJournal, ...prev]);
    };

    const handleSearch = (searchTerm: string) => {
        if (!searchTerm) {
            setFilteredJournals(journals);
            return;
        }
        
        const filtered = journals.filter(journal => 
            journal.title.toLowerCase().includes(searchTerm) || 
            journal.description.toLowerCase().includes(searchTerm)
        );
        
        setFilteredJournals(filtered);
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
                    <Searchbar onSearch={handleSearch} />
                    <NewButton onJournalCreated={handleJournalCreated} />
                </div>
                <JournalCards journals={filteredJournals} setJournals={setJournals} />
            </IonContent>
        </IonPage>
    );
};

export default Home;