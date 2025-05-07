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
  IonToolbar
} from '@ionic/react'
import { homeOutline, informationOutline, logOutOutline, personCircleOutline, rocketOutline } from 'ionicons/icons';
import { Redirect, Route } from 'react-router';
import Home from './Home';
import EditProfile from './EditProfile';
import JournalPage from './JournalPage';
const Menu: React.FC = () => {
  const path = [
    { name: 'Home', url: '/cephaline-supabase/app/home', icon: homeOutline },
    { name: 'Profile', url: '/cephaline-supabase/app/editProfile', icon: personCircleOutline }
  ]

  const glow = {
    animation: 'blink 2s infinite',
    filter: 'drop-shadow(0 0 8px white)',
  };

  const h1Style = {
    ...glow,
    animationDelay: '0.1s',
    color: 'skyblue',
  };
  const h2Style = {
    display: 'flex',
    color: 'skyblue',
    margin: '3%'
  };

  const h3Style = {
    display: 'flex',
    color: 'skyblue',
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
              <IonItem style={h2Style} routerLink={item.url} routerDirection="forward">
                <IonIcon style={h1Style} icon={item.icon} slot="start"></IonIcon>
                {item.name}
              </IonItem>
            </IonMenuToggle>
          ))}
          <IonButton routerLink="/cephaline-supabase" routerDirection="back" expand="full"
            style={{
              marginTop: '10%',
              width: '90vw',
              maxWidth: '250px',
              height: 'auto',
              padding: '1rem',
            }}>
            <IonIcon icon={logOutOutline} slot="start"> </IonIcon>
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
          <Route exact path="/cephaline-supabase/app/home" component={Home} />
          <Route exact path="/cephaline-supabase/app/editProfile" component={EditProfile} />
          <Route exact path="/cephaline-supabase/app/JournalPage/:journalId?" component={JournalPage} />
          <Route exact path="/cephaline-supabase/app">
            <Redirect to="/cephaline-supabase/app/home" />
          </Route>
        </IonRouterOutlet>
      </IonPage>
    </>
  );
};

export default Menu;