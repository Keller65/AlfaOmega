import { useCallback, useEffect, useState, memo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, StyleSheet, FlatList } from 'react-native';
import ClientIcon from '../assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAppStore } from '@/state/index';

interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
}

const PedidosScreen = memo(() => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const employeeCode = user?.employeeCode;
  const router = useRouter();

  const setSelectedCustomer = useAppStore((state) => state.setSelectedCustomer);

  useEffect(() => {
    if (!employeeCode || !user?.token) {
      setLoading(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }
    setLoading(true);
    setError(null);

    axios.get(`http://200.115.188.54:4325/sap/salespersons/${employeeCode}/customers`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    })
      .then(res => setCustomers(res.data))
      .catch(err => {
        console.error('Error al cargar clientes:', err);
        setError(err.response?.data?.message || err.message || 'Error desconocido al cargar clientes.');
        setCustomers([]);
      })
      .finally(() => setLoading(false));
  }, [employeeCode, user?.token]);

  const handleCustomerPress = useCallback(async (customer: Customer) => {
    try {
      setSelectedCustomer(customer);
      console.log('Cliente seleccionado en Zustand:', customer.cardName);

      await router.push({
        pathname: '/shop',
        params: {
          cardCode: customer.cardCode,
          cardName: customer.cardName,
          federalTaxID: customer.federalTaxID
        }
      });
      console.log('Navegación a /shop iniciada.');
    } catch (err) {
      console.error('Error al navegar:', err);
      Alert.alert('Error de navegación', 'No se pudo abrir la pantalla de pedido. Por favor, inténtalo de nuevo.');
    }
  }, [router, setSelectedCustomer]);

  const renderCustomerItem = useCallback(({ item: customer }: { item: Customer }) => (
    <TouchableOpacity
      key={customer.cardCode}
      onPress={() => handleCustomerPress(customer)}
      style={styles.customerItem}
    >
      <View style={styles.iconContainer}>
        <ClientIcon size={24} color="#000" />
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{customer.cardName.toLocaleLowerCase()}</Text>

        <View style={styles.customerDetails}>
          <Text style={styles.detailText}>
            Código: <Text style={styles.detailValue}>{customer.cardCode}</Text>
          </Text>
          <Text style={styles.detailText}>
            RTN: <Text style={styles.detailValue}>{customer.federalTaxID}</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleCustomerPress]);

  if (!user?.token) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.errorText}>No has iniciado sesión o tu sesión ha expirado.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.fullScreenCenter}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando clientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.subText}>Tu sesión ha expirado. Por favor, inicia sesión nuevamente</Text>
      </View>
    );
  }

  if (customers.length === 0) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.emptyText}>No se encontraron clientes asociados a tu cuenta.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.cardCode}
        contentContainerStyle={styles.listContentContainer}
        initialNumToRender={10} // Número inicial de elementos a renderizar
        maxToRenderPerBatch={5} // Cuántos elementos renderizar en cada lote adicional
        windowSize={21} // Cuántos elementos mantener renderizados fuera de la vista
      />
    </View>
  );
});

export default PedidosScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
  },
  subText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  listContentContainer: {
    paddingVertical: 24, // Espacio superior e inferior para la lista
    gap: 24, // Espacio entre elementos
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16, // Padding para el borde de la pantalla
    // No usamos 'className' mezclado con 'style' en este componente optimizado
  },
  iconContainer: {
    backgroundColor: '#f7df09',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 80,
  },
  customerInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  customerName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    letterSpacing: -0.6,
    lineHeight: 20,
    color: '#000', // Color explícito para asegurar que se vea bien
  },
  customerDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  detailText: {
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 20,
    color: '#6b6b6b',
  },
  detailValue: {
    fontFamily: 'Poppins-Regular',
  },
});
