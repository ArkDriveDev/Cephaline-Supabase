import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonViewWillEnter } from '@ionic/react';
import { useState } from 'react';
import Profile from '../components/home_components/profile';
import Searchbar from '../components/home_components/SearchBar';
import NewButton from '../components/home_components/NewButton';
import JournalCards from '../components/home_components/JournalCards';
import SortOptions, { SortOption } from '../components/home_components/SortOptions';

const Home: React.FC = () => {
    const [journals, setJournals] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('date-newest');
    const [refreshKey, setRefreshKey] = useState(0); // Add refresh key

    const handleJournalCreated = (newJournal: any) => {
        setJournals(prevJournals => [newJournal, ...prevJournals]);
    };

    // This will run every time the page is about to enter (including when coming back from another page)
    useIonViewWillEnter(() => {
        setRefreshKey(prevKey => prevKey + 1); // Force refresh
    });

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
                <SortOptions value={sortOption} onChange={setSortOption} />
                <JournalCards
                    key={refreshKey} // This will force remount when refreshKey changes
                    journals={journals}
                    setJournals={setJournals}
                    searchText={searchText}
                    sortOption={sortOption}
                />
            </IonContent>
        </IonPage>
    );
};

export default Home;