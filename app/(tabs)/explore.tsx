import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import ClientIcon from '../../assets/icons/ClientIcon';
import { useAuth } from '@/context/auth';

interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
}

export default function TabTwoScreen() {
  const slpCode = 1;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const employeeCode = user?.employeeCode;

  useEffect(() => {
    fetch(`http://200.115.188.54:4325/sap/salespersons/${employeeCode}/customers`)
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener los clientes');
        return res.json();
      })
      .then(data => setCustomers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slpCode]);

  return (
    <View style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>
      {loading && <ActivityIndicator />}

      {error && <Text style={{ color: 'red' }}>{error}</Text>}

      <View className='gap-6'>
        {customers.map(customer => (
          <View key={customer.cardCode} className='flex-row gap-3 items-center'>

            <View className='bg-[#f7df09] w-[50px] h-[50px] items-center justify-center rounded-[80px]'>
              <ClientIcon size={24} color="#000" />
            </View>

            <View className='flex-1 justify-center gap-2'>
              <Text className='font-[Poppins-SemiBold] text-lg tracking-[-0.6px] leading-4'>{customer.cardName}</Text>

              <View className='flex-row gap-2'>
                <Text className='font-[Poppins-SemiBold] leading-5 text-[#6b6b6b]'>Código: <Text className='font-[Poppins-Regular]'>{customer.cardCode}</Text></Text>
                <Text className='font-[Poppins-SemiBold] leading-5 text-[#6b6b6b]'>RTN: <Text className='font-[Poppins-Regular]'>{customer.federalTaxID}</Text></Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
