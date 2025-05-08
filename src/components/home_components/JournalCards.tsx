import React, { useEffect, useState, useMemo } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../../utils/supaBaseClient';
import './JournalCards.css';
import { SortOption } from './SortOptions';

interface JournalCardsProps {
  journals: any[];
  setJournals: React.Dispatch<React.SetStateAction<any[]>>;
  searchText: string;
  sortOption: SortOption;
}

const JournalCards: React.FC<JournalCardsProps> = ({ 
  journals, 
  setJournals, 
  searchText,
  sortOption 
}) => {
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('journals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setJournals(data || []);
      } catch (error) {
        console.error('Error fetching journals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, [setJournals]);

  const sortedAndFilteredJournals = useMemo(() => {
    const filtered = journals.filter(journal =>
      journal.title.toLowerCase().includes(searchText.toLowerCase()) ||
      journal.description?.toLowerCase().includes(searchText.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'title-asc': return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        case 'date-newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'color-asc': return (a.card_color || '').localeCompare(b.card_color || '');
        case 'color-desc': return (b.card_color || '').localeCompare(a.card_color || '');
        default: return 0;
      }
    });
  }, [journals, searchText, sortOption]);

  const handleCardClick = async (journalId: string) => {
    try {
      const { data: journalPages, error } = await supabase
        .from('journal_pages')
        .select('page_id')
        .eq('journal_id', journalId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (journalPages?.length) {
        history.push(`/Cephaline-Supabase/app/Overviewing/${journalId}`);
      } else {
        history.push(`/Cephaline-Supabase/app/JournalPage/${journalId}`);
      }
    } catch (err) {
      console.error('Error checking journal pages:', err);
      history.push(`/Cephaline-Supabase/app/JournalPage/${journalId}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <IonSpinner name="crescent" />
        <p>Loading your journals...</p>
      </div>
    );
  }

  if (sortedAndFilteredJournals.length === 0) {
    return (
      <div className="empty-state">
        <p>No journals match your search.</p>
      </div>
    );
  }

  return (
    <div className="bookshelf-container">
      <div className="bookshelf">
        <div className="shelf"></div>
        <div className="journal-grid-container">
          {sortedAndFilteredJournals.map((journal) => (
            <div
              key={journal.journal_id}
              className="journal-card-wrapper"
              style={{
                '--card-color': journal.card_color,
                '--title-color': journal.title_color
              } as React.CSSProperties}
              onClick={() => handleCardClick(journal.journal_id)}
            >
              <div className="journal-spine">
                <div className="journal-title-container">
                  <h3 className="journal-title">{journal.title}</h3>
                  <div className="journal-date">
                    {new Date(journal.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="journal-card-preview">
                <IonCard className="journal-card">
                  <IonCardHeader>
                    <IonCardTitle style={{ color: journal.title_color }}>
                      {journal.title}
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p style={{ color: journal.description_color }}>
                      {journal.description}
                    </p>
                    <small>
                      Created: {new Date(journal.created_at).toLocaleDateString()}
                    </small>
                  </IonCardContent>
                </IonCard>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JournalCards;