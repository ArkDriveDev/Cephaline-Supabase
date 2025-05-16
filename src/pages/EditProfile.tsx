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
import EnableMFA from '../components/MultiFactorAuth/EnableMFA';

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
    console.log('EditProfile component mounted');
    const fetchSessionAndData = async () => {
      setIsLoading(true);
      console.log('Starting to fetch session and user data...');
      
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        console.log('Session data:', session);
        console.log('Session error:', sessionError);

        if (sessionError || !session?.session) {
          console.error('No valid session found:', sessionError);
          setAlertMessage('You must be logged in to access this page.');
          setShowAlert(true);
          history.push('/Cephaline-Supabase/login');
          return;
        }

        console.log('Fetching user data for email:', session.session.user.email);
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('user_firstname, user_lastname, user_avatar_url, user_email, username')
          .eq('user_email', session.session.user.email)
          .single();

        console.log('User data:', user);
        console.log('User error:', userError);

        if (userError || !user) {
          console.error('Failed to fetch user data:', userError);
          setAlertMessage('Failed to load user data. Please try again.');
          setShowAlert(true);
          return;
        }

        setFirstName(user.user_firstname || '');
        setLastName(user.user_lastname || '');
        setAvatarPreview(user.user_avatar_url);
        setEmail(user.user_email || '');
        setUsername(user.username || '');
        console.log('User data set in state');
      } catch (error) {
        console.error('Error in fetchSessionAndData:', error);
        setAlertMessage('An unexpected error occurred. Please try again.');
        setShowAlert(true);
      } finally {
        setIsLoading(false);
        console.log('Finished loading user data');
      }
    };

    fetchSessionAndData();

    return () => {
      console.log('Component unmounting - cleaning up');
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
        console.log('Revoked blob URL');
      }
    };
  }, [history]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Avatar input changed');
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
        console.log('Previous blob URL revoked');
      }
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      console.log('New preview URL created:', previewUrl);
    } else {
      console.log('No file selected');
    }
  };

  const validateForm = () => {
    console.log('Validating form...');
    if (password && password !== confirmPassword) {
      console.log('Validation failed: Passwords dont match');
      setAlertMessage("Passwords don't match.");
      return false;
    }

    if (password && !currentPassword) {
      console.log('Validation failed: Current password required');
      setAlertMessage("Please enter your current password to change your password.");
      return false;
    }

    if (!firstName || !lastName) {
      console.log('Validation failed: Missing name fields');
      setAlertMessage("First name and last name are required.");
      return false;
    }

    console.log('Form validation passed');
    return true;
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return avatarPreview;
  
    console.log('Starting avatar upload for user:', userId);
    
    // Validate file
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
  
    try {
      // Delete existing avatar if it exists
      if (avatarPreview && avatarPreview.includes('user-avatars')) {
        try {
          const oldFilePath = avatarPreview.split('user-avatars/')[1].split('?')[0];
          await supabase.storage
            .from('user-avatars')
            .remove([oldFilePath]);
        } catch (deleteError) {
          console.warn('Could not delete old avatar:', deleteError);
        }
      }
  
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: avatarFile.type,
        });
  
      if (uploadError) throw uploadError;
  
      // Get public URL with transformations
      const { data: { publicUrl } } = supabase.storage
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
    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw new Error('Failed to upload avatar. Please try again.');
    }
  };
  const handleUpdate = async () => {
    console.log('Update button clicked');
    if (!validateForm()) {
      console.log('Validation failed - showing alert');
      setShowAlert(true);
      return;
    }

    setIsUpdating(true);
    console.log('Starting update process...');
    
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session error:', sessionError);

      if (sessionError || !session?.session) {
        console.error('No valid session found');
        setAlertMessage('Session expired. Please log in again.');
        setShowAlert(true);
        history.push('/Cephaline-Supabase/login');
        return;
      }

      const user = session.session.user;
      console.log('User ID:', user.id);
      console.log('User email:', user.email);

      if (!user.email || !user.id) {
        console.error('Incomplete user information');
        setAlertMessage('User information is incomplete. Please log in again.');
        setShowAlert(true);
        return;
      }

      if (password) {
        console.log('Password change requested - verifying current password');
        const { error: passwordError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        console.log('Password verification result:', passwordError);

        if (passwordError) {
          console.error('Current password verification failed');
          setAlertMessage('Incorrect current password.');
          setShowAlert(true);
          return;
        }
      }

      let avatarUrl = avatarPreview;
      try {
        console.log('Processing avatar upload...');
        avatarUrl = await uploadAvatar(user.id);
        console.log('Avatar URL after upload:', avatarUrl);
      } catch (error) {
        console.error('Avatar upload error:', error);
        setAlertMessage(error instanceof Error ? error.message : 'Failed to upload avatar');
        setShowAlert(true);
        return;
      }

      console.log('Updating user profile in database...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          user_firstname: firstName,
          user_lastname: lastName,
          user_avatar_url: avatarUrl,
          username: username,
        })
        .eq('user_email', user.email);

      console.log('Profile update result:', updateError);

      if (updateError) {
        console.error('Profile update failed:', updateError);
        setAlertMessage(`Profile update failed: ${updateError.message}`);
        setShowAlert(true);
        return;
      }

      if (password) {
        console.log('Updating password...');
        const { error: passwordUpdateError } = await supabase.auth.updateUser({
          password: password,
        });

        console.log('Password update result:', passwordUpdateError);

        if (passwordUpdateError) {
          console.error('Password update failed:', passwordUpdateError);
          setAlertMessage(`Password update failed: ${passwordUpdateError.message}`);
          setShowAlert(true);
          return;
        }
      }

      console.log('Profile update successful!');
      setAlertMessage('Profile updated successfully!');
      setShowAlert(true);
      setTimeout(() => {
        console.log('Navigating back to app...');
        history.push('/Cephaline-Supabase/app');
      }, 1500);
    } catch (error) {
      console.error('Update error:', error);
      setAlertMessage('An unexpected error occurred. Please try again.');
      setShowAlert(true);
    } finally {
      setIsUpdating(false);
      console.log('Update process completed');
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

        <EnableMFA/>

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