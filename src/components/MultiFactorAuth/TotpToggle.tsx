import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonToggle,
  IonLabel,
  IonItem,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonToast
} from '@ionic/react';
import { copyOutline, refreshOutline } from 'ionicons/icons';

interface TotpToggleProps {
  initialEnabled?: boolean;
  onToggleChange?: (enabled: boolean) => void;
}

const TotpToggle: React.FC<TotpToggleProps> = ({ 
  initialEnabled = false, 
  onToggleChange 
}) => {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [totpCode, setTotpCode] = useState('123 456');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debugging
  useEffect(() => {
    console.log('TotpToggle mounted with enabled:', initialEnabled);
    return () => console.log('TotpToggle unmounted');
  }, []);

  useEffect(() => {
    setIsEnabled(initialEnabled);
    console.log('InitialEnabled changed:', initialEnabled);
  }, [initialEnabled]);

  const handleToggle = (event: CustomEvent) => {
    const enabled = event.detail.checked;
    console.log('Toggle changed to:', enabled);
    setIsEnabled(enabled);
    onToggleChange?.(enabled);
  };

  const regenerateCode = () => {
    setIsLoading(true);
    console.log('Regenerating TOTP code...');
    
    setTimeout(() => {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const formattedCode = newCode.match(/.{1,3}/g)?.join(' ') || newCode;
      
      console.log('Generated new code:', formattedCode);
      setTotpCode(formattedCode);
      setToastMessage('New TOTP code generated!');
      setShowToast(true);
      setIsLoading(false);
    }, 1000);
  };

  const copyToClipboard = async () => {
    try {
      const codeToCopy = totpCode.replace(/\s/g, '');
      await navigator.clipboard.writeText(codeToCopy);
      console.log('Copied to clipboard:', codeToCopy);
      setToastMessage('Code copied to clipboard!');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
      setToastMessage('Failed to copy code!');
      setShowToast(true);
    }
  };

  return (
    <IonContent className="ion-padding" scrollY={true}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        border: '1px solid #ddd', // Debug border
        borderRadius: '8px',
        padding: '16px'
      }}>
        {/* Toggle Section */}
        <IonItem lines="none">
          <IonLabel>TOTP (Time-based One-Time Password)</IonLabel>
          <IonToggle
            checked={isEnabled}
            onIonChange={handleToggle}
            disabled={isLoading}
            aria-label="Enable TOTP"
          />
        </IonItem>

        {isEnabled && (
          <div style={{ marginTop: '20px' }}>
            {/* Regenerate Button */}
            <IonButton 
              expand="block" 
              fill="outline"
              onClick={regenerateCode}
              disabled={isLoading}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Regenerate Code
            </IonButton>

            {/* Code Display Card */}
            <IonCard style={{ marginTop: '16px' }}>
              <IonCardContent>
                <IonGrid>
                  <IonRow className="ion-align-items-center">
                    <IonCol>
                      <h2 style={{ 
                        margin: 0,
                        fontFamily: 'monospace',
                        letterSpacing: '3px'
                      }}>
                        {totpCode}
                      </h2>
                    </IonCol>
                    <IonCol size="auto">
                      <IonButton 
                        fill="clear"
                        onClick={copyToClipboard}
                        aria-label="Copy code"
                      >
                        <IonIcon 
                          icon={copyOutline} 
                          size="large"
                        />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            <div style={{ 
              marginTop: '16px',
              fontSize: '0.9rem',
              color: '#666',
              textAlign: 'center'
            }}>
              Scan this code in your authenticator app
            </div>
          </div>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
          color="primary"
        />
      </div>
    </IonContent>
  );
};

export default TotpToggle;