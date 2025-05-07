import React, { useState } from 'react';
import { IonRange, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { happy, sad, heart, removeCircle, alertCircle } from 'ionicons/icons';

const Spectrum: React.FC = () => {
  const [mood, setMood] = useState(50); // 0-100 scale

  // Mood level configuration
  const moodLevels = [
    { 
      level: 'Angry', 
      min: 0, 
      max: 20, 
      color: '#F44336', 
      icon: alertCircle 
    },
    { 
      level: 'Sad', 
      min: 20, 
      max: 40, 
      color: '#FF9800', 
      icon: sad 
    },
    { 
      level: 'Neutral', 
      min: 40, 
      max: 60, 
      color: '#FFC107', 
      icon: removeCircle 
    },
    { 
      level: 'Happy', 
      min: 60, 
      max: 80, 
      color: '#8BC34A', 
      icon: happy 
    },
    { 
      level: 'Super Happy', 
      min: 80, 
      max: 100, 
      color: '#4CAF50', 
      icon: heart 
    }
  ];

  const getCurrentMood = () => {
    return moodLevels.find(level => mood >= level.min && mood <= level.max) || moodLevels[2];
  };

  const currentMood = getCurrentMood();

  return (
    <IonItem lines="none" style={{ flexDirection: 'column', alignItems: 'flex-start', width: '200px',margin:'30px',marginBottom:'50px'}}>
      <IonLabel>Mood Spectrum</IonLabel>
      <div style={{ display: 'flex', alignItems: 'center', width: '80%' }}>
        <IonIcon icon={currentMood.icon} style={{ color: currentMood.color }} />
        <IonRange
          min={0}
          max={100}
          value={mood}
          onIonChange={(e) => setMood(e.detail.value as number)}
          style={{ 
            flex: 1, 
            margin: '0 12px',
            '--bar-background': `linear-gradient(to right, 
              ${moodLevels.map(level => `${level.color} ${level.min}%, ${level.color} ${level.max}%`).join(', ')}`
          }}
        />
        <IonIcon icon={currentMood.icon} style={{ color: currentMood.color,size:'100%'}} />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%',
        marginTop: '8px'
      }}>
        {moodLevels.map(level => (
          <div key={level.level} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IonIcon icon={level.icon} style={{ color: level.color, fontSize: '16px' }} />
            <span style={{ fontSize: '10px', marginTop: '4px' }}>{level.level}</span>
          </div>
        ))}
      </div>
      <IonLabel style={{ 
        fontSize: '14px', 
        marginTop: '12px',
        margin:'10px',
        color: currentMood.color,
        fontWeight: 'bold'
      }}>
        Current Mood: {currentMood.level}
      </IonLabel>
    </IonItem>
  );
};

export default Spectrum;