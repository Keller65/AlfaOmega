import { useCallback, useEffect, useState, memo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, FlatList } from 'react-native';
import ClientIcon from '../assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAppStore } from '@/state/index';
import { Customer } from '@/types/types';

const PedidosScreen = memo(() => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const setSelectedCustomer = useAppStore((state) => state.setSelectedCustomer);

  useEffect(() => {
    if (!user?.salesPersonCode || !user?.token) {
      setLoading(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }

    setLoading(true);
    setError(null);

    axios
      .get(`http://200.115.188.54:4325/sap/customers/by-salesperson?slpCode=${user.salesPersonCode}&page=1&pageSize=20`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      })
      .then((res) => {
        setCustomers(res.data.items || []);
        console.log('Clientes cargados:', res.data.items);
      })
      .catch((err) => {
        console.error('Error al cargar clientes:', err);
        setError(err.response?.data?.message || err.message || 'Error desconocido al cargar clientes.');
        setCustomers([]);
      })
      .finally(() => setLoading(false));
  }, [user?.salesPersonCode, user?.token]);

  const handleCustomerPress = useCallback(
    async (customer: Customer) => {
      try {
        setSelectedCustomer(customer);
        console.log('Cliente seleccionado en Zustand:', customer.cardName);

        await router.push({
          pathname: '/shop',
          params: {
            cardCode: customer.cardCode,
            cardName: customer.cardName,
            federalTaxID: customer.federalTaxID,
            priceListNum: customer.priceListNum
          },
        });
        console.log('Navegación a /shop iniciada a: ', customer.cardName);
      } catch (err) {
        console.error('Error al navegar:', err);
        Alert.alert('Error de navegación', 'No se pudo abrir la pantalla de pedido. Por favor, inténtalo de nuevo.');
      }
    },
    [router, setSelectedCustomer]
  );

  const renderCustomerItem = useCallback(
    ({ item: customer }: { item: Customer }) => (
      <TouchableOpacity
        key={customer.cardCode}
        onPress={() => handleCustomerPress(customer)}
        className="flex-row items-center gap-3 px-4"
      >
        <View className="bg-yellow-300 w-[50px] h-[50px] items-center justify-center rounded-full">
          <ClientIcon size={24} color="#000" />
        </View>

        <View className="flex-1 justify-center gap-2">
          <Text className="font-semibold text-lg text-black lowercase tracking-tight">
            {customer.cardName}
          </Text>

          <View className="flex-row gap-2">
            <Text className="text-gray-600 font-semibold">
              Código: <Text className="font-normal">{customer.cardCode}</Text>
            </Text>
            <Text className="text-gray-600 font-semibold">
              RTN: <Text className="font-normal">{customer.federalTaxID}</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleCustomerPress]
  );

  if (!user?.token) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-center text-red-500 text-base font-normal">No has iniciado sesión o tu sesión ha expirado.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007bff" />
        <Text className="mt-3 text-gray-700 text-base font-normal">Cargando clientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-red-500 text-base font-normal text-center mb-2">{error}</Text>
        <Text className="text-gray-500 text-sm text-center">Tu sesión ha expirado. Por favor, inicia sesión nuevamente</Text>
      </View>
    );
  }

  if (customers.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-5">
        <Text className="text-gray-500 text-base font-normal text-center">No se encontraron clientes asociados a tu cuenta.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.cardCode}
        contentContainerStyle={{ paddingVertical: 24, rowGap: 24 }}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={21}
      />
    </View>
  );
});

export default PedidosScreen;
