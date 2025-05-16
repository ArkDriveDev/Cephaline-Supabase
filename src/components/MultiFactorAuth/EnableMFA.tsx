import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonGrid,
    IonRow,
    IonCol,
    IonToggle,
    IonLabel,
    IonAlert,
    IonList,
    IonItem,
    IonText,
    IonButton,
    IonIcon,
    IonToast,
    IonCard,
    IonCardContent
} from '@ionic/react';
import { supabase } from '../../utils/supaBaseClient';
import { copyOutline, checkmarkDoneOutline, closeOutline } from 'ionicons/icons';
import { useCopyToClipboard } from 'react-use';

const EnableMFA: React.FC = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [showCodes, setShowCodes] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [state, copyToClipboard] = useCopyToClipboard();

    // Check if MFA is already enabled on component mount
    useEffect(() => {
        const checkMFAStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('recovery_codes')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('code_status', 'active')
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setIsEnabled(true);
                }
            }
        };

        checkMFAStatus();
    }, []);

    const generateRecoveryCodes = async (userId: string) => {
        // Generate 5 random 8-digit codes
        const codes = Array.from({ length: 5 }, () =>
            Math.floor(10000000 + Math.random() * 90000000).toString()
        );

        // Call the Supabase function
        const { data: generatedCodes, error } = await supabase.rpc(
            'generate_recovery_codes',
            {
                p_user_id: userId,
                p_codes: codes
            }
        );

        if (error) {
            console.error('Error saving recovery codes:', error);
            throw error;
        }

        return generatedCodes || codes;
    };

    const handleToggle = async (e: CustomEvent) => {
        const enabled = e.detail.checked;

        try {
            if (enabled) {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) throw new Error('No authenticated user');

                // Generate and store recovery codes
                const codes = await generateRecoveryCodes(user.id);
                setRecoveryCodes(codes);
                setShowCodes(true);
                setToastMessage('MFA enabled successfully!');
            } else {
                // Disable MFA by revoking all active codes
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('recovery_codes')
                        .update({ code_status: 'revoked' })
                        .eq('user_id', user.id)
                        .eq('code_status', 'active');
                }
                setToastMessage('MFA disabled successfully!');
            }

            setIsEnabled(enabled);
            setShowToast(true);
        } catch (error: any) {
            console.error('Error toggling MFA:', error);
            setIsEnabled(!enabled); // Revert toggle on error
            setToastMessage(error.message || 'Failed to update MFA settings');
            setShowToast(true);
        }
    };

    const copyCodes = () => {
        copyToClipboard(recoveryCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <IonContent className="ion-padding">
            <IonCard>
                <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                        <div style={{ flexGrow: 1 }}>
                            <h2 style={{ margin: 0 }}>Enable Multi-Factor Authentication</h2>
                            <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                                Add an extra layer of security to your account
                            </p>
                             <IonToggle
                            checked={isEnabled}
                            onIonChange={handleToggle}
                        />
                        </div>
                    </div>
                </IonCardContent>
            </IonCard>

            <IonAlert
                isOpen={showCodes}
                onDidDismiss={() => setShowCodes(false)}
                header="Recovery Codes Generated"
                subHeader="Save these codes in a secure place"
                message="Each code can be used only once. You won't be able to see these again."
                buttons={[
                    {
                        text: 'I Have Saved These',
                        handler: () => setShowCodes(false)
                    }
                ]}
            >
                <div className="ion-padding">
                    <IonList lines="full">
                        {recoveryCodes.map((code, index) => (
                            <IonItem key={index}>
                                <IonText>
                                    <strong>{code}</strong>
                                </IonText>
                            </IonItem>
                        ))}
                    </IonList>

                    <IonButton
                        expand="block"
                        onClick={copyCodes}
                        color="primary"
                        className="ion-margin-top"
                    >
                        <IonIcon
                            slot="start"
                            icon={copied ? checkmarkDoneOutline : copyOutline}
                        />
                        {copied ? 'Copied!' : 'Copy All Codes'}
                    </IonButton>

                    <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => setShowCodes(false)}
                        className="ion-margin-top"
                    >
                        <IonIcon slot="start" icon={closeOutline} />
                        Close
                    </IonButton>
                </div>
            </IonAlert>

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={3000}
                position="top"
                color={toastMessage.includes('success') ? 'success' : 'danger'}
            />
        </IonContent>
    );
};

export default EnableMFA;