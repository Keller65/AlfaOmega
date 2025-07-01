import * as Location from 'expo-location';
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/auth";

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
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

  if (user) return <Redirect href="/" />;

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/LogoAlfayOmega.png')}
        className="h-[120px] w-[260px] object-contain mx-auto mb-[60px]"
      />

      <View className="flex gap-6">
        <View>
          <Text className="font-[Poppins-Medium] tracking-[-0.8px] text-[15px]">Usuario</Text>
          <TextInput
            className="h-14 bg-gray-100 text-gray-500 leading-3 px-6 rounded-xl font-[Poppins-Medium]"
            placeholder="Ingrese su Usuario"
            value={email}
            onChangeText={setEmail}
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
        onPress={() => login({ email, password } as any, "yourHostHere", "yourPortHere")}
      >
        <Text className="text-white text-center font-[Poppins-Bold] leading-3">Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 12,
    padding: 10,
  },
});
