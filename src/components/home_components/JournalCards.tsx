import React, { useEffect, useState } from 'react';
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

const JournalCards: React.FC = () => {
  const history = useHistory();
  const [journals, setJournals] = useState<any[]>([]);
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
  }, []);

  const handleCardClick = (journalId: string) => {
    history.push(`/cephaline-supabase/app/JournalPage/:${journalId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <IonSpinner name="crescent" />
        <p>Loading your journals...</p>
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div className="empty-state">
        <p>You don't have any journals yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="journal-grid-container">
      {journals.map((journal) => {
        const cardStyle = {
          '--card-color': journal.card_color,
          '--title-color': journal.title_color
        } as React.CSSProperties;

        return (
          <div
            key={journal.journal_id}
            className="journal-card-wrapper"
            style={cardStyle}
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
        );
      })}
    </div>
  );
};

export default JournalCards;