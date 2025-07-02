import Constants from 'expo-constants';
import { Text, View } from 'react-native';
import "../../global.css";

export default function HomeScreen() {
  return (
    <View style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>
      <Text>Bienvenido al sistema de gestión de inventario</Text>
    </View>
  );
}