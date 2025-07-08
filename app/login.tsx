import axios from 'axios';
import * as Location from 'expo-location';
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../context/auth";

export default function Login() {
  const { user } = useAuth();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
    if (loading) return;
    setLoading(true);

    try {
      const deviceToken = "";

      const response = await axios.post('http://200.115.188.54:4325/auth/employee', {
        employeeCode: Number(employeeCode),
        password: password,
        token: deviceToken
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data;
      const userData = {
        employeeCode: data.salesPersonCode,
        fullName: data.fullName,
        password: password,
        token: data.token
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData as any);
      console.log('Datos del usuario:', userData);
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Error', 'Credenciales incorrectas. Por favor, verifica tu código de empleado y contraseña.');
        } else if (error.response.status >= 500) {
          Alert.alert('Error', 'Error del servidor. Por favor, inténtalo de nuevo más tarde.');
        } else {
          Alert.alert('Error', `Algo salió mal: ${error.response.status}.`);
        }
      } else if (error.request) {
        Alert.alert('Error', 'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.');
      } else {
        Alert.alert('Error', 'Ocurrió un error inesperado al iniciar sesión.');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
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
            editable={!loading}
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
            keyboardType="numeric"
            editable={!loading}
          />
        </View>
      </View>

      <TouchableOpacity
        className="mt-4 bg-blue-500 p-4 h-14 rounded-xl flex items-center justify-center"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" /> // Show spinner
        ) : (
          <Text className="text-white text-center font-[Poppins-Bold] leading-3">Iniciar Sesión</Text> // Show text
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "white"
  },
});