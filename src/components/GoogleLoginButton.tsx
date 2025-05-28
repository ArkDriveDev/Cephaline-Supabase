// src/components/GoogleLoginButton.tsx
import { IonButton, IonIcon, useIonToast,IonSpinner } from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import { supabase } from '../utils/supaBaseClient';
import { useIonRouter } from '@ionic/react';
import { useEffect, useState } from 'react';

const GoogleLoginButton = () => {
  const router = useIonRouter();
  const [presentToast] = useIonToast();
  const [isLoading, setIsLoading] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await presentToast({
            message: 'Login successful!',
            duration: 2000,
            position: 'top',
            color: 'success'
          });
          router.push('/app', 'root', 'replace');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Force full Google authentication flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account', // Force account selection
            access_type: 'offline'
          },
          redirectTo: window.location.origin // Stay on same page
        }
      });

      if (error) throw error;

      // Session will be created automatically
      // The auth listener above will handle the redirect

    } catch (error: any) {
      setIsLoading(false);
      await presentToast({
        message: error.message || 'Google login failed',
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      console.error('Login error:', error);
    }
  };

  return (
    <IonButton 
      expand="block" 
      onClick={handleGoogleLogin}
      fill="outline"
      disabled={isLoading}
      className="google-login-button"
    >
      {isLoading ? (
        <IonSpinner name="crescent" />
      ) : (
        <>
          <IonIcon slot="start" icon={logoGoogle} />
          Continue with Google
        </>
      )}
    </IonButton>
  );
};

export default GoogleLoginButton;