import * as Location from 'expo-location';
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Button } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../context/auth";

export default function Login() {
  const { user } = useAuth();
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      console.log('Coordenadas:', location.coords);
    })();
  }, []);

  const { setUser } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await fetch('http://200.115.188.54:4325/auth/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: Number(employeeCode),
          password: password
        }),
      });
      if (!response.ok) {
        Alert.alert('Error', 'Credenciales incorrectas');
        return;
      }
      const data = await response.json();
      const userData = {
        employeeCode: Number(employeeCode),
        fullName: data.fullName,
        password: password,
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData as any);
      console.log('Datos del usuario:', userData);
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    }
  };

  if (user) return <Redirect href="/" />;

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/LogoAlfayOmega.png')}
        className="h-[120px] w-[260px] object-contain mx-auto mb-[60px]"
      />

      <View className="flex gap-6">
        <View>
          <Text className="font-[Poppins-Medium] tracking-[-0.8px] text-[15px]">Código de Empleado</Text>
          <TextInput
            className="h-14 bg-gray-100 text-gray-500 leading-3 px-6 rounded-xl font-[Poppins-Medium]"
            placeholder="Ingrese su Código"
            value={employeeCode}
            onChangeText={setEmployeeCode}
            keyboardType="numeric"
          />
        </View>

        <View>
          <Text className="font-[Poppins-Medium] tracking-[-0.8px] text-[15px]">Contraseña</Text>
          <TextInput
            className="h-14 bg-gray-100 text-gray-500 leading-3 px-6 rounded-xl font-[Poppins-Medium]"
            placeholder="Ingrese su Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity
        className="mt-4 bg-blue-500 p-4 h-14 rounded-xl flex items-center justify-center"
        onPress={handleLogin}
      >
        <Text className="text-white text-center font-[Poppins-Bold] leading-3">Iniciar Sesión</Text>
      </TouchableOpacity>

      <View className='w-full flex items-center' style={{ marginTop: 100 }}>
        <TouchableOpacity>
          <Text style={{ color: '#09f' }} className="text-center font-[Poppins-Regular]">Configuracion</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
});