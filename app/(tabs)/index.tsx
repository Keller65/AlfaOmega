import Constants from 'expo-constants';
import { Text, View } from 'react-native';
import "../../global.css";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    fetchUser();
  }, []);

  return (
    <View style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>
      <Text>Bienvenido al sistema de gestión de inventario</Text>
      {user && (
        <View style={{ marginTop: 16 }}>
          <Text>Usuario: {user.fullName}</Text>
          <Text>token: {user.token}</Text>
        </View>
      )}
    </View>
  );
}