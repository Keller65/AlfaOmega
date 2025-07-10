import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/auth';
import FingerSprint from '@/components/FingerSprint';
import NotificationsToggle from '@/components/Notifications';

const Settings = () => {
  const { logout } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
      if (bioEnabled) setBiometricEnabled(bioEnabled === 'true');
    };
    loadData();
  }, []);

  async function ClearData () {
    await AsyncStorage.clear()
  }

  return (
    <View
      className="mt-2 bg-white flex-1"
      style={{ paddingTop: Constants.statusBarHeight }}
    >
      <View className="mb-3 w-full flex gap-2 p-2">
        <FingerSprint />
        <NotificationsToggle />
      </View>

      <TouchableOpacity className="w-full p-2" onPress={logout}>
        <Text className="text-red-500 text-center">Cerrar Sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity className="w-full p-2" onPress={ClearData}>
        <Text className="text-red-500 text-center">Borrar Data</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Settings;
