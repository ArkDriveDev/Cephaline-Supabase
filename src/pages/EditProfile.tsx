import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonButton, IonAlert, IonHeader,
  IonBackButton, IonButtons, IonItem, IonText, IonLoading
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    const fetchSessionAndData = async () => {
      setIsLoading(true);
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.session) {
          setAlertMessage('You must be logged in to access this page.');
          setShowAlert(true);
          history.push('/Cephaline-Supabase/login');
          return;
        }

        const { data: user, error: userError } = await supabase
          .from('users')
          .select('user_firstname, user_lastname, user_avatar_url, user_email, username')
          .eq('user_email', session.session.user.email)
          .single();

        if (userError || !user) {
          setAlertMessage('Failed to load user data. Please try again.');
          setShowAlert(true);
          return;
        }

        setFirstName(user.user_firstname || '');
        setLastName(user.user_lastname || '');
        setAvatarPreview(user.user_avatar_url);
        setEmail(user.user_email || '');
        setUsername(user.username || '');
      } catch (error) {
        setAlertMessage('An unexpected error occurred. Please try again.');
        setShowAlert(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionAndData();

    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [history]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    if (password && password !== confirmPassword) {
      setAlertMessage("Passwords don't match.");
      return false;
    }

    if (password && !currentPassword) {
      setAlertMessage("Please enter your current password to change your password.");
      return false;
    }

    if (!firstName || !lastName) {
      setAlertMessage("First name and last name are required.");
      return false;
    }

    return true;
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return avatarPreview;

    if (avatarFile.size > 5 * 1024 * 1024) {
      throw new Error('Avatar image must be less than 5MB');
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(avatarFile.type)) {
      throw new Error('Only JPG, PNG, GIF, or WebP images are allowed');
    }

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    if (avatarPreview && avatarPreview.includes('user-avatars')) {
      const oldFilePath = avatarPreview.split('user-avatars/')[1].split('?')[0];
      await supabase.storage.from('user-avatars').remove([oldFilePath]);
    }

    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = await supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath, {
        transform: {
          width: 200,
          height: 200,
          resize: 'cover',
          quality: 80,
        },
      });

    return publicUrl;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      setShowAlert(true);
      return;
    }

    setIsUpdating(true);
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.session) {
        setAlertMessage('Session expired. Please log in again.');
        setShowAlert(true);
        history.push('/Cephaline-Supabase/login');
        return;
      }

      const user = session.session.user;

      if (!user.email || !user.id) {
        setAlertMessage('User information is incomplete. Please log in again.');
        setShowAlert(true);
        return;
      }

      if (password) {
        const { error: passwordError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (passwordError) {
          setAlertMessage('Incorrect current password.');
          setShowAlert(true);
          return;
        }
      }

      let avatarUrl = avatarPreview;
      try {
        avatarUrl = await uploadAvatar(user.id);
      } catch (error) {
        console.error('Avatar upload error:', error);
        setAlertMessage(error instanceof Error ? error.message : 'Failed to upload avatar');
        setShowAlert(true);
        return;
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
        setAlertMessage(`Profile update failed: ${updateError.message}`);
        setShowAlert(true);
        return;
      }

      if (password) {
        const { error: passwordUpdateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (passwordUpdateError) {
          setAlertMessage(`Password update failed: ${passwordUpdateError.message}`);
          setShowAlert(true);
          return;
        }
      }

      setAlertMessage('Profile updated successfully!');
      setShowAlert(true);
      setTimeout(() => history.push('/Cephaline-Supabase/app'), 1500);
    } catch (error) {
      console.error('Update error:', error);
      setAlertMessage('An unexpected error occurred. Please try again.');
      setShowAlert(true);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/Cephaline-Supabase/app" />
        </IonButtons>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLoading isOpen={isLoading} message="Loading profile..." />

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

        <IonButton 
          expand="full" 
          onClick={handleUpdate} 
          shape="round"
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Account'}
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