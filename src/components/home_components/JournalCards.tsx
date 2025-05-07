import React, { useEffect, useState } from 'react';
import { 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonPopover,
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
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch journals for this user
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

  // Group journals into rows of 3 for the grid layout
  const rows = [];
  for (let i = 0; i < journals.length; i += 3) {
    rows.push(journals.slice(i, i + 3));
  }

  const handleCardClick = (journalId: string) => {
    history.push(`/Cephaline/Journals/${journalId}`);
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
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="journal-row">
          {row.map((journal, colIndex) => (
            <div
              key={journal.journal_id}
              className="journal-card-wrapper"
              style={{ zIndex: row.length - colIndex }}
              onClick={() => handleCardClick(journal.journal_id)}
            >
              <IonCard className="journal-card" style={{
                backgroundColor: journal.card_color,
              }}>
                <IonCardHeader>
                  <IonCardTitle
                    className="journal-title"
                    id={`hover-trigger-${journal.journal_id}`}
                    style={{ color: journal.title_color }}
                  >
                    {journal.title}
                  </IonCardTitle>
                  <IonPopover
                    trigger={`hover-trigger-${journal.journal_id}`}
                    triggerAction="hover"
                    side="top"
                  >
                    <div className="ion-padding">Click To Open Journal</div>
                  </IonPopover>
                </IonCardHeader>

                <IonCardContent className="journal-content">
                  <p className="journal-description" style={{ color: journal.description_color }}>
                    {journal.description}
                  </p>
                  <small className="journal-date">
                    Created: {new Date(journal.created_at).toLocaleDateString()}
                  </small>
                </IonCardContent>
              </IonCard>

              {/* Book spine effect */}
              <div
                className="journal-spine"
                style={{ zIndex: row.length - colIndex - 1 }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default JournalCards;