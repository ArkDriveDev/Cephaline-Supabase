import {
    IonAlert,
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonPage,
    IonToast,
    useIonRouter
} from '@ionic/react';
import favicons from '../images/favicon.png';
import { useState } from 'react';
import { supabase } from '../utils/supaBaseClient';

const ForgotPass: React.FC = () => {
    const navigation = useIonRouter();
    const [email, setEmail] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            setAlertMessage("Please enter your email address");
            setShowAlert(true);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setAlertMessage("Please enter a valid email address");
            setShowAlert(true);
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/changepass`,
            });

            if (error) throw error;

            setShowToast(true);
            setAlertMessage("Password reset link sent. Check your email to proceed.");
            setShowAlert(true);
            setEmail('');
        } catch (error: any) {
            setAlertMessage(error.message || "Failed to send reset link.");
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent className="ion-padding" style={{ backgroundColor: '#121212' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '1rem',
                    padding: '1rem'
                }}>
                    {/* Box Container */}
                    <div style={{
                        backgroundColor: '#1e1e1e',
                        borderRadius: '16px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '450px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <IonAvatar
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: '#2c2c2e',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <img
                                src={favicons}
                                alt="Logo"
                            />
                        </IonAvatar>

                        <h1 style={{
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '22px',
                            margin: '0 0 8px 0'
                        }}>
                            Reset Password
                        </h1>

                        <p style={{
                            color: '#a1a1aa',
                            fontSize: '14px',
                            margin: '0 0 24px 0',
                            textAlign: 'center',
                            maxWidth: '300px'
                        }}>
                            Enter your email to receive a reset link
                        </p>

                        <div style={{ width: '100%', marginBottom: '1rem' }}>
                            <IonInput
                                label="Email"
                                labelPlacement="floating"
                                fill="outline"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onIonChange={e => setEmail(e.detail.value!)}
                                style={{
                                    color: '#ffffff',
                                    '--placeholder-color': '#a1a1aa',
                                    '--color': '#ffffff',
                                    width: '100%',
                                    '--background': '#2c2c2e',
                                    '--border-radius': '8px'
                                }}
                            />
                        </div>

                        <IonButton
                            onClick={handleResetPassword}
                            expand="block"
                            shape="round"
                            disabled={isLoading}
                            style={{
                                marginTop: '10px',
                                width: '100%',
                                fontWeight: 'bold',
                                '--background': '#3880ff',
                                '--background-activated': '#4d8eff',
                                '--background-focused': '#4d8eff',
                                '--background-hover': '#4d8eff',
                                '--border-radius': '8px',
                                height: '46px'
                            }}
                        >
                            {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
                        </IonButton>
                    </div>

                    <IonButton
                        routerLink="/#/"
                        fill="clear"
                        style={{
                            color: '#000000',
                            textTransform: 'none',
                            fontSize: '14px',
                            fontWeight: 'normal',
                            '--background-activated': 'transparent',
                            marginTop: '1rem'
                        }}
                    >
                        Back to  <b>LOGIN</b>
                    </IonButton>
                </div>

                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={() => setShowAlert(false)}
                    header="Notification"
                    message={alertMessage}
                    buttons={['OK']}
                />

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message="Reset link sent!"
                    duration={2000}
                    position="top"
                    color="success"
                />
            </IonContent>
        </IonPage>
    );
};

export default ForgotPass;