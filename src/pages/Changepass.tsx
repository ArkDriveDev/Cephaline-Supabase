import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';
import { IonContent, IonPage, IonInput, IonButton, IonAlert, IonToast, IonText, IonProgressBar } from '@ionic/react';

const ChangePass: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [accessToken, setAccessToken] = useState('');

    useEffect(() => {
        // Parse the URL hash for Supabase auth parameters
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const emailParam = params.get('email');
        const accessTokenParam = params.get('access_token');
        const typeParam = params.get('type');

        if (emailParam && accessTokenParam && typeParam === 'recovery') {
            setEmail(emailParam);
            setAccessToken(accessTokenParam);
        } else {
            setError('Invalid password reset link');
        }
    }, []);

    const handleReset = async () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // First verify we can use the token
            const { error: authError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: ''
            });

            if (authError) throw authError;

            // Then update the password
            const { error: updateError } = await supabase.auth.updateUser({
                password
            });

            if (updateError) throw updateError;

            setSuccess('Password updated successfully!');
            setTimeout(() => {
                window.location.href = 'https://cephaline-supabase.vercel.app/#/';
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <IonPage>
            <IonContent className="ion-padding">
                <div className="auth-container">
                    <h2>Reset Password</h2>
                    
                    {email && <p>For: {email}</p>}
                    
                    <IonInput
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onIonChange={(e) => setPassword(e.detail.value!)}
                    />
                    
                    <IonInput
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                    />
                    
                    <IonButton 
                        expand="block" 
                        onClick={handleReset}
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </IonButton>
                    
                    <IonAlert
                        isOpen={!!error}
                        onDidDismiss={() => setError('')}
                        message={error}
                        buttons={['OK']}
                    />
                    
                    <IonToast
                        isOpen={!!success}
                        onDidDismiss={() => setSuccess('')}
                        message={success}
                        duration={2000}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ChangePass;