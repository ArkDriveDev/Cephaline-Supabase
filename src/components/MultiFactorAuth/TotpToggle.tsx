import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonToggle,
  IonLabel,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonText
} from '@ionic/react';
import { copyOutline, refreshOutline } from 'ionicons/icons';

interface TotpToggleProps {
  initialEnabled?: boolean;
  onToggleChange?: (enabled: boolean) => void;
  userEmail?: string;
}

const TotpToggle: React.FC<TotpToggleProps> = ({
  initialEnabled = false,
  onToggleChange,
  userEmail = 'user@example.com'
}) => {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateNewSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result.match(/.{1,4}/g)?.join('') || '';
  };

  const initializeTOTP = () => {
    const secret = generateNewSecret();
    setTotpSecret(secret);
  };

  useEffect(() => {
    if (isEnabled && !totpSecret) {
      initializeTOTP();
    }
  }, [isEnabled]);

  const handleToggle = (event: CustomEvent) => {
    const enabled = event.detail.checked;
    setIsEnabled(enabled);

    if (enabled) {
      initializeTOTP();
    } else {
      setTotpSecret('');
    }

    if (onToggleChange) {
      onToggleChange(enabled);
    }
  };

  const regenerateSecret = () => {
    setIsLoading(true);
    initializeTOTP();
    setToastMessage('New TOTP secret generated!');
    setShowToast(true);
    setIsLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage('Copied to clipboard!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to copy!');
      setShowToast(true);
    }
  };

  return (
    <IonContent className="ion-padding" scrollY={true}>
      {/* Toggle label and switch side-by-side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <IonLabel>
          <strong>TOTP</strong> (Time-based One-Time Password)
        </IonLabel>
        <IonToggle
          checked={isEnabled}
          onIonChange={handleToggle}
          disabled={isLoading}
          aria-label="Enable TOTP"
        />
      </div>

      {isEnabled && totpSecret && (
        <div>
          <IonCard>
            <IonCardContent>
              <IonGrid>
                <IonRow className="ion-align-items-center">
                  <IonCol>
                    <IonText>
                      <h3 style={{ margin: 0 }}>Secret Key:</h3>
                      <p
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '1.1rem',
                          letterSpacing: '1px'
                        }}
                      >
                        {totpSecret}
                      </p>
                    </IonText>
                  </IonCol>
                  <IonCol size="auto">
                    <IonButton
                      fill="clear"
                      onClick={() => copyToClipboard(totpSecret)}
                      aria-label="Copy secret"
                    >
                      <IonIcon icon={copyOutline} />
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          <IonButton
            expand="block"
            fill="outline"
            onClick={regenerateSecret}
            disabled={isLoading}
            style={{ marginTop: '16px' }}
          >
            <IonIcon slot="start" icon={refreshOutline} />
            Generate New Secret Key
          </IonButton>

          <IonText
            color="medium"
            style={{ display: 'block', marginTop: '16px' }}
          >
            <p>Enter this secret key into your authenticator app:</p>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '1.2rem',
                letterSpacing: '1px',
                fontWeight: 'bold'
              }}
            >
              {totpSecret}
            </p>
          </IonText>
        </div>
      )}

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
      />
    </IonContent>
  );
};

export default TotpToggle;
