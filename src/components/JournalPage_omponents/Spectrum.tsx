import React from 'react';
import { IonRange, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { happy, sad, heart, removeCircle, alertCircle } from 'ionicons/icons';
import { useState} from 'react';

interface SpectrumProps {
  selectedMood: string | null;
  onMoodChange: (mood: string) => void;
}

const Spectrum: React.FC<SpectrumProps> = ({ selectedMood, onMoodChange }) => {
  // Mood level configuration
  const moodLevels = [
    { 
      level: 'angry', 
      display: 'Angry',
      min: 0, 
      max: 20, 
      color: '#F44336', 
      icon: alertCircle 
    },
    { 
      level: 'sad', 
      display: 'Sad',
      min: 20, 
      max: 40, 
      color: '#FF9800', 
      icon: sad 
    },
    { 
      level: 'neutral', 
      display: 'Neutral',
      min: 40, 
      max: 60, 
      color: '#FFC107', 
      icon: removeCircle 
    },
    { 
      level: 'happy', 
      display: 'Happy',
      min: 60, 
      max: 80, 
      color: '#8BC34A', 
      icon: happy 
    },
    { 
      level: 'love', 
      display: 'Super Happy',
      min: 80, 
      max: 100, 
      color: '#4CAF50', 
      icon: heart 
    }
  ];

  const [sliderValue, setSliderValue] = useState(
    selectedMood 
      ? moodLevels.findIndex(m => m.level === selectedMood) * 20 + 10 || 50
      : 50
  );

  const getCurrentMood = () => {
    const mood = moodLevels.find(level => sliderValue >= level.min && sliderValue <= level.max) || moodLevels[2];
    return mood;
  };

  const currentMood = getCurrentMood();

  const handleMoodChange = (value: number) => {
    setSliderValue(value);
    const mood = moodLevels.find(level => value >= level.min && value <= level.max) || moodLevels[2];
    onMoodChange(mood.level);
  };

  return (
    <IonItem lines="none" style={{ 
      flexDirection: 'column', 
      alignItems: 'flex-start', 
      width: '100%',
      margin: '30px 0 50px 0',
      padding: '0 16px'
    }}>
      <IonLabel>Mood Spectrum</IonLabel>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <IonIcon icon={currentMood.icon} style={{ color: currentMood.color }} />
        <IonRange
          min={0}
          max={100}
          value={sliderValue}
          onIonChange={(e) => handleMoodChange(e.detail.value as number)}
          style={{ 
            flex: 1, 
            margin: '0 12px',
            '--bar-background': `linear-gradient(to right, 
              ${moodLevels.map(level => `${level.color} ${level.min}%, ${level.color} ${level.max}%`).join(', ')}`
          }}
        />
        <IonIcon icon={currentMood.icon} style={{ color: currentMood.color }} />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%',
        marginTop: '8px'
      }}>
        {moodLevels.map(level => (
          <div key={level.level} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IonIcon 
              icon={level.icon} 
              style={{ 
                color: level.level === currentMood.level ? level.color : '#cccccc', 
                fontSize: '16px' 
              }} 
            />
            <span style={{ 
              fontSize: '10px', 
              marginTop: '4px',
              color: level.level === currentMood.level ? level.color : '#666666'
            }}>
              {level.display}
            </span>
          </div>
        ))}
      </div>
      <IonLabel style={{ 
        fontSize: '14px', 
        marginTop: '12px',
        margin: '10px',
        color: currentMood.color,
        fontWeight: 'bold'
      }}>
        Current Mood: {currentMood.display}
      </IonLabel>
    </IonItem>
  );
};

export default Spectrum;