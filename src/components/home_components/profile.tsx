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
import { supabase } from '../../utils/supaBaseClient';

const Profile: React.FC = () => {
  const [name, setName] = useState<string>('Loading...');
  const [bio, setBio] = useState<string>('Loading...');
  const [profileImage, setProfileImage] = useState<string>('https://placehold.co/200');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user) {
        setName("Not logged in");
        return;
      }
  
      // Get user profile data
      const { data, error } = await supabase
        .from('users')
        .select('username, user_firstname, user_lastname, user_avatar_url')
        .eq('user_email', user.email)
        .single();
  
      if (error) throw error;
  
      setName(data.username || "No username");
      setBio(`${data.user_firstname} ${data.user_lastname}`.trim() || "No bio");
      
      // Handle avatar URL
      if (data.user_avatar_url) {
        // If the URL is already a full URL (from previous uploads)
        if (data.user_avatar_url.startsWith('http')) {
          setProfileImage(data.user_avatar_url);
        } 
        // If it's just a path (new format)
        else {
          // Get the public URL from Supabase Storage
          const { data: { publicUrl } } = await supabase.storage
            .from('user-avatars')
            .getPublicUrl(data.user_avatar_url);
          
          setProfileImage(publicUrl);
        }
      } else {
        setProfileImage('https://placehold.co/200');
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setName("Error loading profile");
      setBio("Please try again later");
    }
  };

  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      {/* Profile Image */}
      <IonAvatar style={{ width: '200px', height: '200px', margin: '0 auto 16px' }}>
        <IonImg 
          src={profileImage} 
          style={{ objectFit: 'cover' }}
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = 'https://placehold.co/200';
          }}
        />
      </IonAvatar>

      {/* Profile Info */}
      <IonLabel>
        <h2 style={{ margin: '8px 0', fontSize: '1.5rem' }}>{name}</h2>
        <p style={{ margin: '8px 0', color: '#666' }}>{bio}</p>
      </IonLabel>

      {/* Edit Button */}
      <IonButton 
        fill="outline" 
        style={{ marginTop: '16px' }}
        routerLink="/cephaline-supabase/app/editProfile" 
      >
        <IonIcon icon={pencil} slot="start" />
        Edit Profile
      </IonButton>
    </div>
  );
};

export default Profile;