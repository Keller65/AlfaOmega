import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import '../../global.css'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => setExpoPushToken(token))
      .catch(console.error);

    // Escuchar notificaciones cuando llegan
    const subscription1 = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Escuchar interacción con la notificación
    const subscription2 = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notificación interactuada:', response);
    });

    return () => {
      subscription1.remove();
      subscription2.remove();
    };
  }, []);

  async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      Alert.alert('Debes usar un dispositivo físico para recibir notificaciones');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('No se concedieron permisos para notificaciones');
      return null;
    }

    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      console.log('Token FCM:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      Alert.alert('Error obteniendo token', `${error}`);
      return null;
    }
  }

  return (
    <View className='flex-1 justify-center items-center bg-white p-6'>
      <Text>Token FCM:</Text>
      <Text selectable>{expoPushToken ?? 'Obteniendo token...'}</Text>
      {notification && (
        <>
          <Text style={{ marginTop: 20 }}>Notificación recibida:</Text>
          <Text>Título: {notification.request.content.title}</Text>
          <Text>Mensaje: {notification.request.content.body}</Text>
        </>
      )}
    </View>
  );
}
