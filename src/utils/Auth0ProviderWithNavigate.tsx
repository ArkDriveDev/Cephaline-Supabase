import { Auth0Provider } from '@auth0/auth0-react';
import { useIonRouter } from '@ionic/react'; // Use Ionic's router instead
import { ReactNode } from 'react';

const Auth0ProviderWithNavigate = ({ children }: { children: ReactNode }) => {
  const ionRouter = useIonRouter(); // Ionic's router hook

  const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'your-domain.auth0.com';
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-client-id';
  const redirectUri = window.location.origin;

  const onRedirectCallback = (appState: any) => {
    // Use Ionic's navigation method
    ionRouter.push(appState?.returnTo || window.location.pathname, 'forward', 'replace');
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithNavigate;