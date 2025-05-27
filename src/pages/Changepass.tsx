import {
    IonAlert,
    IonAvatar,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonPage,
    IonToast,
    useIonRouter,
    IonText,
    IonProgressBar
} from '@ionic/react';
import favicons from '../images/favicon.png';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';

const ChangePass: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        value: 0,
        label: '',
        color: ''
    });

    useEffect(() => {
        if (newPassword) {
            const strength = calculatePasswordStrength(newPassword);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength({
                value: 0,
                label: '',
                color: ''
            });
        }
    }, [newPassword]);

    const calculatePasswordStrength = (password: string) => {
        let strength = 0;

        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        if (strength <= 2) return { value: 0.25, label: 'Very Weak', color: 'danger' };
        if (strength <= 4) return { value: 0.5, label: 'Weak', color: 'warning' };
        if (strength <= 6) return { value: 0.75, label: 'Strong', color: 'success' };
        return { value: 1, label: 'Very Strong', color: 'primary' };
    };

    const handlePasswordUpdate = async () => {
        if (!newPassword || !confirmPassword) {
            setAlertMessage("Please fill in all password fields");
            setShowAlert(true);
            return;
        }

        if (newPassword !== confirmPassword) {
            setAlertMessage("Passwords do not match");
            setShowAlert(true);
            return;
        }

        if (newPassword.length < 6) {
            setAlertMessage("Password must be at least 6 characters");
            setShowAlert(true);
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setShowToast(true);
            setAlertMessage("Password updated successfully!");
            setShowAlert(true);

            await supabase.auth.signOut();
            window.location.href = 'https://cephaline-supabase.vercel.app';
        } catch (error: any) {
            setAlertMessage(error.message || "Password update failed. Please try again.");
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
                            Set New Password
                        </h1>

                        <div style={{ width: '100%', marginBottom: '1rem' }}>
                            <IonInput
                                label="New Password"
                                labelPlacement="floating"
                                fill="outline"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onIonChange={e => setNewPassword(e.detail.value!)}
                                style={{
                                    width: '100%',
                                    color: '#ffffff',
                                    '--placeholder-color': '#a1a1aa',
                                    '--background': '#2c2c2e',
                                    '--border-radius': '8px'
                                }}
                            />

                            {newPassword && (
                                <div style={{ width: '100%', marginTop: '8px' }}>
                                    <IonProgressBar
                                        value={passwordStrength.value}
                                        color={passwordStrength.color}
                                        style={{ height: '4px' }}
                                    />
                                    <IonText color={passwordStrength.color} style={{ fontSize: '12px' }}>
                                        {passwordStrength.label}
                                    </IonText>
                                </div>
                            )}
                        </div>

                        <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                            <IonInput
                                label="Confirm Password"
                                labelPlacement="floating"
                                fill="outline"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onIonChange={e => setConfirmPassword(e.detail.value!)}
                                style={{
                                    width: '100%',
                                    color: '#ffffff',
                                    '--placeholder-color': '#a1a1aa',
                                    '--background': '#2c2c2e',
                                    '--border-radius': '8px'
                                }}
                            />
                        </div>

                        <IonButton
                            onClick={handlePasswordUpdate}
                            expand="block"
                            shape="round"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                fontWeight: 'bold',
                                '--background': '#3880ff',
                                '--border-radius': '8px',
                                height: '46px'
                            }}
                        >
                            {isLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                        </IonButton>

                        <div style={{
                            width: '100%',
                            color: '#a1a1aa',
                            fontSize: '12px',
                            marginTop: '1.5rem'
                        }}>
                            <p>Password should contain:</p>
                            <ul style={{ paddingLeft: '20px', margin: '8px 0 0 0' }}>
                                <li style={{ color: newPassword.length >= 8 ? '#3880ff' : '#a1a1aa' }}>
                                    At least 8 characters
                                </li>
                                <li style={{ color: /[A-Z]/.test(newPassword) ? '#3880ff' : '#a1a1aa' }}>
                                    One uppercase letter
                                </li>
                                <li style={{ color: /[0-9]/.test(newPassword) ? '#3880ff' : '#a1a1aa' }}>
                                    One number
                                </li>
                                <li style={{ color: /[^A-Za-z0-9]/.test(newPassword) ? '#3880ff' : '#a1a1aa' }}>
                                    One special character
                                </li>
                            </ul>
                        </div>
                    </div>

                    <IonButton
                        routerLink="/"
                        fill="clear"
                        style={{
                            color: '#3880ff',
                            textTransform: 'none',
                            fontSize: '14px',
                            fontWeight: 'normal',
                            '--background-activated': 'transparent',
                            marginTop: '1rem'
                        }}
                    >
                        Back to <b>LOGIN</b>
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
                    message="Password updated successfully!"
                    duration={2000}
                    position="top"
                    color="success"
                />
            </IonContent>
        </IonPage>
    );
};

export default ChangePass;