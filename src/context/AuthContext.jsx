import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToAuthChanges,
  loginUser,
  registerUser,
  logoutUser,
  updateUserProfile
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user, profile) => {
      setCurrentUser(user);
      setUserProfile(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setCurrentUser(res.user);
    setUserProfile(res.profile);
    return res;
  };

  const register = async (email, password, displayName, location) => {
    const res = await registerUser(email, password, displayName, location);
    setCurrentUser(res.user);
    setUserProfile(res.profile);
    return res;
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateProfileData = async (data) => {
    if (!currentUser) return;
    const updated = await updateUserProfile(currentUser.uid, data);
    setUserProfile(updated);
    return updated;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateProfileData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
