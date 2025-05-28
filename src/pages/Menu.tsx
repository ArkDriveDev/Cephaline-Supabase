import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonPage,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { homeOutline, informationOutline, logOutOutline, personCircleOutline, rocketOutline } from 'ionicons/icons';
import { Redirect, Route, useHistory } from 'react-router';
import Home from './Home';
import EditProfile from './EditProfile';
import JournalPage from './JournalPage';
import Overviewing from './Overviewing';
import PageList from './PageList';
import JournalPageView from './JournalPageView';
import { supabase } from '../utils/supaBaseClient';

const Menu: React.FC = () => {
  const history = useHistory();

  // Updated paths with hash prefix
  const path = [
    { name: 'Home', url: '/#/app/home', icon: homeOutline },
    { name: 'Profile', url: '/#/app/editProfile', icon: personCircleOutline },
  ]

  const glow = {
    animation: 'blink 2s infinite',
    filter: 'drop-shadow(0 0 8px white)',
  };

  const h1Style = {
    ...glow,
    animationDelay: '0.1s',
    color: 'black',
  };
  const h2Style = {
    display: 'flex',
    color: 'black',
    margin: '3%'
  };

  const h3Style = {
    display: 'flex',
    color: 'white',
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect to login page after successful logout
      history.push('/#/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <IonMenu contentId="main-content">
        <IonHeader>
          <IonToolbar>
            <IonTitle style={h1Style}>Menu Content</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {path.map((item, index) => (
            <IonMenuToggle key={index}>
              <IonItem style={h2Style} routerLink={item.url.replace('/#', '')} routerDirection="forward">
                <IonIcon style={h1Style} icon={item.icon} slot="start"></IonIcon>
                {item.name}
              </IonItem>
            </IonMenuToggle>
          ))}
          <IonButton 
            onClick={handleLogout}
            expand="full"
            style={{
              marginTop: '10%',
              width: '90vw',
              maxWidth: '250px',
              height: 'auto',
              padding: '1rem',
            }}>
            <IonIcon icon={logOutOutline} slot="start"></IonIcon>
            Logout
          </IonButton>
        </IonContent>
      </IonMenu>
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton style={h1Style}></IonMenuButton>
            </IonButtons>
            <IonTitle style={h3Style}>Menu</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonRouterOutlet id="main">
          {/* Removed hash from Route paths since they're handled internally */}
          <Route exact path="/app/home" component={Home} />
          <Route exact path="/app/editProfile" component={EditProfile} />
          <Route exact path="/app/JournalPage/:journalId?" component={JournalPage} />
          <Route exact path="/app/page-list/:journalId" component={PageList} />
          <Route exact path="/app/JournalPageView/:journalId/:pageId" component={JournalPageView} />
          <Route
            exact
            path="/app/Overviewing/:journalId"
            component={Overviewing}
          />
          <Route exact path="/app">
            <Redirect to="/app/home" />
          </Route>
        </IonRouterOutlet>
      </IonPage>
    </>
  );
};

export default Menu;