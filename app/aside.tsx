import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import ClientIcon from '../assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import axios from 'axios';

interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
}

export default function PedidosScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const employeeCode = user?.employeeCode;
  const router = useRouter();

  useEffect(() => {
    if (!employeeCode || !user?.token) return;
    setLoading(true);
    setError(null);

    axios.get(`http://200.115.188.54:4325/sap/salespersons/${employeeCode}/customers`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
    })
      .then(res => setCustomers(res.data))
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [employeeCode, user?.token]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ paddingHorizontal: 10 }}>
        {loading && <ActivityIndicator size="large" color="#0000ff" />}

        {error && <Text style={{ color: 'red' }}>{error}</Text>}

        <View style={{ gap: 24 }}>
          {customers.map(customer => (
            <TouchableOpacity
              key={customer.cardCode}
              onPress={async () => {
                try {
                  await router.push({
                    pathname: '/pedido/[cardCode]',
                    params: {
                      cardCode: customer.cardCode,
                      cardName: customer.cardName,
                      federalTaxID: customer.federalTaxID
                    }
                  });
                } catch (err) {
                  console.error('Error al navegar:', err);
                  Alert.alert('Error de navegación', 'No se pudo abrir la pantalla de pedido.');
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ backgroundColor: '#f7df09', width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 80 }}>
                <ClientIcon size={24} color="#000" />
              </View>

              <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
                <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 18, letterSpacing: -0.6, lineHeight: 20 }}>{customer.cardName}</Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Text style={{ fontFamily: 'Poppins-SemiBold', lineHeight: 20, color: '#6b6b6b' }}>
                    Código: <Text style={{ fontFamily: 'Poppins-Regular' }}>{customer.cardCode}</Text>
                  </Text>
                  <Text style={{ fontFamily: 'Poppins-SemiBold', lineHeight: 20, color: '#6b6b6b' }}>
                    RTN: <Text style={{ fontFamily: 'Poppins-Regular' }}>{customer.federalTaxID}</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}