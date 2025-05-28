import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { HashRouter as Router } from 'react-router-dom';
import { Route, Redirect } from 'react-router-dom';

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
import Menu from './pages/Menu';
import ForgotPass from './pages/ForgotPass';
import ChangePass from './pages/Changepass';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <Router>
      <IonRouterOutlet>
        <Route exact path="/" component={Login} />
        <Route exact path="/registration" component={Registration} />
        <Route exact path="/forgotpass" component={ForgotPass} />
        <Route exact path="/changepass" component={ChangePass} />
        <Route path="/app" component={Menu} />
        <Redirect to="/" />
      </IonRouterOutlet>
    </Router>
  </IonApp>
);

export default App;