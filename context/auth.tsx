import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string;
  email: string;
  employeeCode?: string;
  fullName?: string;
  password?: string;
  token?: string;
};

type AuthContextType = {
  user: User | null;
  host: string | null;
  port: string | null;
  login: (userData: User, host: string, port: string) => void;
  logout: () => void;
  setHostPort: (host: string, port: string) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [port, setPort] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const userData = await AsyncStorage.getItem('user');
      const savedHost = await AsyncStorage.getItem('host');
      const savedPort = await AsyncStorage.getItem('port');
      if (userData) setUser(JSON.parse(userData));
      if (savedHost) setHost(savedHost);
      if (savedPort) setPort(savedPort);
    };
    loadData();
  }, []);

  const login = async (userData: User, hostValue: string, portValue: string) => {
    setUser(userData);
    setHost(hostValue);
    setPort(portValue);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('host', hostValue);
    await AsyncStorage.setItem('port', portValue);
  };

  const setHostPort = async (hostValue: string, portValue: string) => {
    setHost(hostValue);
    setPort(portValue);
    await AsyncStorage.setItem('host', hostValue);
    await AsyncStorage.setItem('port', portValue);
  };

  const logout = async () => {
    setUser(null);
    setHost(null);
    setPort(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('host');
    await AsyncStorage.removeItem('port');

    console.log('Usuario ha cerrado sesión');
  };

  return (
    <AuthContext.Provider value={{ user, host, port, login, logout, setHostPort, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};