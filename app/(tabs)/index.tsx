import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/auth';
import "../../global.css";

export default function HomeScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const employeeCode = user?.employeeCode;

  console.log('user: ', employeeCode);

  function FetchProducts() {
    fetch('http://200.115.188.54:4325/sap/Items/Active')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        console.error('Error fetching items', e);
      });
  }

  useEffect(() => {
    fetch('http://200.115.188.54:4325/sap/Items/Active')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        console.error('Error fetching items', e);
      });
  }, []);

  if (loading) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View className='flex-1 items-center justify-center gap-6'>
        <Text>No se pudo cargar el producto.</Text>

        <TouchableOpacity onPress={FetchProducts}>
          <Text className='text-blue-400'>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>
      <ScrollView>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.itemCode || idx}
            onPress={() => router.push({
              pathname: '/product-detail',
              params: {
                itemName: item.itemName,
                itemCode: item.itemCode,
                inStock: item.inStock,
                committed: item.committed,
                price: item.price
              }
            })}
            activeOpacity={0.7}
          >
            <View className='flex-row gap-3' style={{ marginBottom: 16 }}>
              <View className='size-[140px] rounded-xl bg-gray-300'></View>
              <View className='flex-1 flex justify-center'>
                <Text className="font-bold text-lg leading-4">{item.itemName}</Text>
                <Text className="">UPC: {item.itemCode}</Text>
                <Text className="">Stock: {item.inStock}</Text>
                <Text className="">Committed: {item.committed}</Text>
                <Text className="">Precio: L.{item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}