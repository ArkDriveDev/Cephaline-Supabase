import {
    IonAlert,
    IonAvatar,
    IonButton,
    IonContent,
    IonInput,
    IonPage,
    IonToast,
    IonText,
    IonProgressBar
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';

const ChangePass: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');

    // Extract token and email from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        const tokenParam = params.get('token');

        if (emailParam && tokenParam) {
            setEmail(decodeURIComponent(emailParam));
            setToken(tokenParam);
            verifyToken(emailParam, tokenParam);
        } else {
            setAlertMessage("Invalid password reset link");
            setShowAlert(true);
        }
    }, []);

    const verifyToken = async (email: string, token: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'recovery'
            });

            if (error) throw error;
            
        } catch (error: any) {
            console.error("Token verification failed:", error);
            setAlertMessage(error.message || "Invalid or expired reset link");
            setShowAlert(true);
            // Optional: Redirect after showing error
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (newPassword !== confirmPassword) {
            setAlertMessage("Passwords don't match");
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
            // Update password
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setAlertMessage("Password updated successfully! Redirecting...");
            setShowAlert(true);

            // Sign out and redirect
            await supabase.auth.signOut();
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } catch (error: any) {
            setAlertMessage(error.message || "Password update failed");
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent 
                className="ion-padding"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    backgroundColor: '#f5f5f5'
                }}
            >
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    <h1 style={{
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        color: '#333'
                    }}>Reset Your Password</h1>
                    
                    <IonInput
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onIonChange={(e) => setNewPassword(e.detail.value!)}
                        style={{
                            marginBottom: '1rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '0.5rem'
                        }}
                    />
                    
                    <IonInput
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                        style={{
                            marginBottom: '1.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '0.5rem'
                        }}
                    />
                    
                    <IonButton 
                        expand="block" 
                        onClick={handlePasswordUpdate}
                        disabled={isLoading}
                        style={{
                            marginTop: '1rem',
                            '--background': '#428cff',
                            '--background-activated': '#2a7aff',
                            '--background-focused': '#2a7aff',
                            '--background-hover': '#2a7aff'
                        }}
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </IonButton>
                </div>

                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={() => setShowAlert(false)}
                    header="Alert"
                    message={alertMessage}
                    buttons={['OK']}
                />

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message="Password updated successfully!"
                    duration={2000}
                />
            </IonContent>
        </IonPage>
    );
};

export default ChangePass;