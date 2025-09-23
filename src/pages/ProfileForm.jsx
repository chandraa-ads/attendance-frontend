// src/components/ProfileForm.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../api/supabaseClient';

export default function ProfileForm() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div>
      <h2>Profile Form</h2>
      <p>Name: {profile.name}</p>
      <p>Email: {profile.email}</p>
      <p>Role: {profile.role}</p>
      <p>Mobile: {profile.mobile}</p>
      <p>Emergency Contact (IEN): {profile.ien}</p>
    </div>
  );
}
