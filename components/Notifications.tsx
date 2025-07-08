import React, { useEffect, useState } from 'react';
import { View, Text, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const NotificationsToggle = () => {
  const [enabled, setEnabled] = useState(false);
  const iconColor = '#2563EB';

  useEffect(() => {
    const loadSetting = async () => {
      const stored = await AsyncStorage.getItem('notificationsEnabled');
      if (stored) setEnabled(stored === 'true');
    };
    loadSetting();
  }, []);

  const toggleSwitch = async (value: boolean) => {
    setEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', value ? 'true' : 'false');
  };

  return (
    <View className="bg-white rounded-xl shadow-md p-5 flex-row items-center justify-between">
      <View className="flex-row items-center space-x-4 gap-3">
        <MaterialIcons name="notifications" size={36} color={iconColor} />
        <View>
          <Text className="text-lg font-semibold text-gray-900">Notificaciones</Text>
          <Text className="text-gray-500 text-sm">Activa o desactiva las notificaciones</Text>
        </View>
      </View>

      <Switch
        trackColor={{ false: '#9ca3af', true: iconColor }}
        thumbColor={enabled ? '#1D4ED8' : '#f4f3f4'}
        ios_backgroundColor="#9ca3af"
        onValueChange={toggleSwitch}
        value={enabled}
      />
    </View>
  );
};

export default NotificationsToggle;