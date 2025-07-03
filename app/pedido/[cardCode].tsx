import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ProductComponent from '@/components/productos/Productos';

const PedidoScreen: React.FC = () => {
  const route = useRoute();
  const { cardCode, cardName, federalTaxID } = route.params as {
    cardCode?: string;
    cardName?: string;
    federalTaxID?: string;
  };

  return (
    <View style={styles.container}>
      <ProductComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, marginBottom: 8 },
  code: { fontFamily: 'monospace', fontSize: 14, backgroundColor: '#eee', padding: 8 },
});

export default PedidoScreen;