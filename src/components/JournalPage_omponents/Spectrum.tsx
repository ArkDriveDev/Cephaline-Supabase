import React, { useState } from 'react';
import { IonRange, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { happy, sad, heart, removeCircle, alertCircle } from 'ionicons/icons';

interface SpectrumProps {
  onMoodChange: (mood: string) => void;
}

interface MoodLevel {
  level: string;
  min: number;
  max: number;
  color: string;
  icon: any;
}

const Spectrum: React.FC<SpectrumProps> = ({ onMoodChange }) => {
  const [mood, setMood] = useState(50); // 0-100 scale

  // Mood level configuration
  const moodLevels: MoodLevel[] = [
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

  const getCurrentMood = (): MoodLevel => {
    return moodLevels.find(level => mood >= level.min && mood <= level.max) || moodLevels[2];
  };

  const currentMood = getCurrentMood();

  // Call onMoodChange whenever the mood updates
  const handleMoodChange = (value: number) => {
    setMood(value);
    const moodLevel = getCurrentMood().level;
    onMoodChange(moodLevel);
  };

  return (
    <IonItem 
      lines="none" 
      style={{ 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        width: '900px', 
        margin: '30px', 
        marginBottom: '50px'
      }}
    >
      <IonLabel>Mood Spectrum</IonLabel>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <IonIcon 
          icon={currentMood.icon} 
          style={{ 
            color: currentMood.color,
            fontSize: '24px',
            marginRight: '12px'
          }} 
        />
        <IonRange
          min={0}
          max={100}
          pin={true}
          snaps={true}
          value={mood}
          onIonChange={(e) => handleMoodChange(e.detail.value as number)}
          style={{ 
            flex: 1, 
            margin: '0 12px',
            '--bar-background': `linear-gradient(to right, 
              ${moodLevels.map(level => `${level.color} ${level.min}%, ${level.color} ${level.max}%`).join(', ')})`,
            '--bar-height': '8px',
            '--knob-size': '20px'
          }}
        />
        <IonIcon 
          icon={currentMood.icon} 
          style={{ 
            color: currentMood.color,
            fontSize: '24px',
            marginLeft: '12px'
          }} 
        />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%',
        marginTop: '8px'
      }}>
        {moodLevels.map(level => (
          <div 
            key={level.level} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              width: `${100/moodLevels.length}%`
            }}
          >
            <IonIcon 
              icon={level.icon} 
              style={{ 
                color: level.color, 
                fontSize: '20px',
                opacity: currentMood.level === level.level ? 1 : 0.6
              }} 
            />
            <span style={{ 
              fontSize: '12px', 
              marginTop: '4px',
              color: level.color,
              fontWeight: currentMood.level === level.level ? 'bold' : 'normal'
            }}>
              {level.level}
            </span>
          </div>
        ))}
      </div>
      <IonLabel style={{ 
        fontSize: '16px', 
        marginTop: '16px',
        marginLeft: '10px',
        color: currentMood.color,
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%'
      }}>
        Current Mood: {currentMood.level}
      </IonLabel>
    </IonItem>
  );
};

export default Spectrum;