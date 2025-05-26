import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';

/* Core CSS imports */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS imports */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme imports */
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

/* Page imports */
import Login from './pages/Login';
import Registration from './pages/Register';
import ChangePass from './pages/Changepass';
import Menu from './pages/Menu';


setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/Cephaline-Supabase" component={Login} />
          <Route exact path="/Cephaline-Supabase/registration" component={Registration} />
          <Route exact path="/Cephaline-Supabase/changepassword" component={ChangePass} />
          <Route path="/Cephaline-Supabase/app" component={Menu} />
        </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;