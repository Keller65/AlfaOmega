import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import '../../global.css';

// Configuración global de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    sound: 'default',
    vibrate: true,
    visibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    // Solicitar permisos y obtener token
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          console.log('Expo Push Token:', token);
        }
      })
      .catch(error => {
        console.error('Error al registrar notificaciones:', error);
      });

    // Escuchar notificación entrante
    const subscription1 = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Escuchar respuesta a la notificación
    const subscription2 = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interacción con la notificación:', response);
    });

    return () => {
      subscription1.remove();
      subscription2.remove();
    };
  }, []);

  // Función para registrar y obtener token de notificación Expo
  async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      Alert.alert('Solo dispositivos físicos pueden recibir notificaciones');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permiso de notificaciones no concedido');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  }

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <Text className="text-lg font-semibold mb-2">Expo Push Token:</Text>
      <Text selectable className="text-center">{expoPushToken ?? 'Obteniendo token...'}</Text>

      {notification && (
        <View className="mt-6">
          <Text className="font-semibold">Notificación recibida:</Text>
          <Text>Título: {notification.request.content.title ?? 'Sin título'}</Text>
          <Text>Mensaje: {notification.request.content.body ?? 'Sin contenido'}</Text>
        </View>
      )}
    </View>
  );
}
