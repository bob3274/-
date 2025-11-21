
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';

interface UserContextType {
  users: UserProfile[];
  currentUser: UserProfile;
  addUser: (name: string, pin?: string) => void;
  switchUser: (id: string) => void;
  deleteUser: (id: string) => void;
  themeColor: string;
  setThemeColor: (rgb: string) => void; // Format: "59, 130, 246"
  getUserStorageKey: (key: string) => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_USER: UserProfile = { id: 'default', name: 'Admin' };
const DEFAULT_THEME = '59, 130, 246'; // Blue

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>([DEFAULT_USER]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [themeColor, setThemeColorState] = useState(DEFAULT_THEME);

  // Load Users & Theme from LocalStorage on Boot
  useEffect(() => {
    const savedUsers = localStorage.getItem('myhub_users');
    const savedCurrentId = localStorage.getItem('myhub_current_user_id');
    const savedTheme = localStorage.getItem('myhub_theme');

    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      setUsers(parsedUsers);
      if (savedCurrentId) {
        const found = parsedUsers.find((u: UserProfile) => u.id === savedCurrentId);
        if (found) setCurrentUser(found);
      }
    }

    if (savedTheme) {
      setThemeColorState(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (rgb: string) => {
    document.documentElement.style.setProperty('--color-primary', rgb);
  };

  const setThemeColor = (rgb: string) => {
    setThemeColorState(rgb);
    applyTheme(rgb);
    localStorage.setItem('myhub_theme', rgb);
  };

  const saveUsers = (newUsers: UserProfile[]) => {
    setUsers(newUsers);
    localStorage.setItem('myhub_users', JSON.stringify(newUsers));
  };

  const addUser = (name: string, pin?: string) => {
    const newUser: UserProfile = { 
      id: Date.now().toString(), 
      name, 
      pin: pin || undefined // ensure empty string becomes undefined
    };
    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    switchUser(newUser.id);
  };

  const switchUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('myhub_current_user_id', user.id);
    }
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) return; // Cannot delete last user
    const newUsers = users.filter(u => u.id !== id);
    saveUsers(newUsers);
    if (currentUser.id === id) {
      switchUser(newUsers[0].id);
    }
  };

  const getUserStorageKey = (key: string) => {
    return `${currentUser.id}_${key}`;
  };

  return (
    <UserContext.Provider value={{ 
      users, 
      currentUser, 
      addUser, 
      switchUser, 
      deleteUser,
      themeColor,
      setThemeColor,
      getUserStorageKey
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
