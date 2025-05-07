import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent, IonPage, IonButton, IonAlert, IonHeader,
  IonBackButton, IonButtons, IonItem, IonText,
} from '@ionic/react';
import { supabase } from '../utils/supaBaseClient';
import { useHistory } from 'react-router-dom';
import AvatarUpload from '../components/editprofile_components/AvatarUpload';
import PersonalInfoForm from '../components/editprofile_components/PersonalInfoForm';
import PasswordChangeForm from '../components/editprofile_components/PasswordChangeForm';

const EditProfile: React.FC = () => {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
  
      if (sessionError || !session || !session.session) {
        setAlertMessage('You must be logged in to access this page.');
        setShowAlert(true);
        history.push('/it35-lab/login');
        return;
      }
  
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('user_firstname, user_lastname, user_avatar_url, user_email, username')
        .eq('user_email', session.session.user.email)
        .single();
  
      if (userError || !user) {
        setAlertMessage('User data not found.');
        setShowAlert(true);
        return;
      }
  
      setFirstName(user.user_firstname || '');
      setLastName(user.user_lastname || '');
      setAvatarPreview(user.user_avatar_url);
      setEmail(user.user_email);
      setUsername(user.username || '');
    };
  
    fetchSessionAndData();
  }, [history]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    if (password !== confirmPassword) {
      setAlertMessage("Passwords don't match.");
      setShowAlert(true);
      return;
    }
  
    const { data: session, error: sessionError } = await supabase.auth.getSession();
  
    if (sessionError || !session || !session.session) {
      setAlertMessage('Error fetching session or no session available.');
      setShowAlert(true);
      return;
    }
  
    const user = session.session.user;
  
    if (!user.email) {
      setAlertMessage('Error: User email is missing.');
      setShowAlert(true);
      return;
    }
      
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
      
    if (passwordError) {
      setAlertMessage('Incorrect current password.');
      setShowAlert(true);
      return;
    }
  
    let avatarUrl = avatarPreview;
  
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
    
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });
    
      if (uploadError) {
        setAlertMessage(`Avatar upload failed: ${uploadError.message}`);
        setShowAlert(true);
        return;
      }
    
      const { data } = supabase.storage.from('user-avatars').getPublicUrl(filePath);
      avatarUrl = data.publicUrl;
    }
      
    const { error: updateError } = await supabase
      .from('users')
      .update({
        user_firstname: firstName,
        user_lastname: lastName,
        user_avatar_url: avatarUrl,
        username: username,
      })
      .eq('user_email', user.email);
  
    if (updateError) {
      setAlertMessage(updateError.message);
      setShowAlert(true);
      return;
    }
  
    if (password) {
      const { error: passwordUpdateError } = await supabase.auth.updateUser({
        password: password,
      });
  
      if (passwordUpdateError) {
        setAlertMessage(passwordUpdateError.message);
        setShowAlert(true);
        return;
      }
    }
  
    setAlertMessage('Account updated successfully!');
    setShowAlert(true);
    history.push('/it35-lab/app');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/it35-lab/app" />
        </IonButtons>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonText color="secondary">
            <h1>Edit Account</h1>
          </IonText>
        </IonItem>
        <br />

        <AvatarUpload 
          avatarPreview={avatarPreview} 
          handleAvatarChange={handleAvatarChange} 
        />

        <PersonalInfoForm
          username={username}
          firstName={firstName}
          lastName={lastName}
          setUsername={setUsername}
          setFirstName={setFirstName}
          setLastName={setLastName}
        />

        <PasswordChangeForm
          password={password}
          confirmPassword={confirmPassword}
          currentPassword={currentPassword}
          setPassword={setPassword}
          setConfirmPassword={setConfirmPassword}
          setCurrentPassword={setCurrentPassword}
        />

        <IonButton expand="full" onClick={handleUpdate} shape="round">
          Update Account
        </IonButton>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;