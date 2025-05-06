import React, { useState, useEffect } from 'react';
import { 
  IonAvatar, 
  IonItem, 
  IonLabel, 
  IonImg, 
  IonButton, 
  IonIcon 
} from '@ionic/react';
import { pencil } from 'ionicons/icons';
import { supabase } from '../utils/supaBaseClient';

const Profile: React.FC = () => {
  const [name, setName] = useState<string>('Loading...');
  const [bio, setBio] = useState<string>('Loading...');
  const [profileImage, setProfileImage] = useState<string>('https://placehold.co/200');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Get the authenticated user (UUID)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("Auth user ID:", user?.id); // Debug
  
      if (!user) {
        setName("Not logged in");
        return;
      }
  
      // Query using Supabase Auth's `id` (UUID), not `user_id` (SERIAL)
      const { data, error } = await supabase
        .from('users')
        .select('username, user_firstname, user_lastname, user_avatar_url')
        .eq('user_email', user.email) // Match by email (or link tables properly)
        .single();
  
      console.log("Profile data:", data); // Debug
  
      if (error) throw error;
  
      setName(data.username || "No username");
      setBio(`${data.user_firstname} ${data.user_lastname}`.trim() || "No bio");
      setProfileImage(data.user_avatar_url || 'https://placehold.co/200');
    } catch (error) {
      console.error("Error:", error);
      setName("Error loading name");
      setBio("Error loading bio");
    }
  };

  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      {/* Profile Image */}
      <IonAvatar style={{ width: '200px', height: '200px', margin: '0 auto 16px' }}>
        <IonImg src={profileImage} style={{ objectFit: 'cover' }} />
      </IonAvatar>

      {/* Profile Info */}
      <IonLabel>
        <h2 style={{ margin: '8px 0', fontSize: '1.5rem' }}>{name}</h2>
        <p style={{ margin: '8px 0', color: '#666' }}>{bio}</p>
      </IonLabel>

      {/* Edit Button */}
      <IonButton fill="outline" style={{ marginTop: '16px' }}>
        <IonIcon icon={pencil} slot="start" />
        Edit Profile
      </IonButton>
    </div>
  );
};

export default Profile;