import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { OrderDataType } from '@/types/types';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import Constants from 'expo-constants';

const OrderDetails = () => {
  const route = useRoute();
  const { OrderDetails } = route.params as { OrderDetails: any };
  const [orderData, setOrderData] = useState<OrderDataType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`http://200.115.188.54:4325/sap/quotations/${OrderDetails}`);
        setOrderData(response.data);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (OrderDetails) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [OrderDetails]);

  const totalItems = useMemo(() => {
    // Aquí se cambia de 'documentLines' a 'lines'
    return orderData?.lines.reduce((sum, line) => sum + line.quantity, 0) || 0;
  }, [orderData]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className='font-[Poppins-Regular]'>Cargando detalles del pedido...</Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className='font-[Poppins-Regular]'>No se encontraron detalles para este pedido.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className='flex-1' style={{ marginTop: -Constants.statusBarHeight }}>
      <ScrollView className='flex-1 p-4 bg-gray-50'>
        <View className='p-5 bg-white rounded-lg shadow-sm'>
          {/* Encabezado con información del cliente */}
          <View className='flex-row justify-between items-center mb-5'>
            <View className='flex-row items-center'>
              <FontAwesome name="user-circle-o" size={24} color="#000" />
              <Text className='ml-2 text-lg font-[Poppins-SemiBold] tracking-[-0.3px]'>{orderData.cardName}</Text>
            </View>
          </View>

          {/* Métrica de resumen */}
          <View className='flex-row justify-between mb-5'>
            <View className='flex-1 p-3 bg-gray-50 rounded-lg mr-2'>
              <Text className='text-xs text-gray-500'>Estado</Text>
              <View className='flex-row items-center mt-1'>
                <Ionicons name="checkmark-circle" size={18} color="green" />
                <Text className='ml-1 text-sm font-[Poppins-SemiBold] text-green-600'>Completado</Text>
              </View>
            </View>
            <View className='flex-1 p-3 bg-gray-50 rounded-lg ml-2'>
              <Text className='text-xs text-gray-500 font-[Poppins-Regular]'>Fecha</Text>
              <Text className='text-sm font-[Poppins-SemiBold] mt-1'>{new Date(orderData.docDate).toLocaleDateString()}</Text>
            </View>
          </View>

          {/* Métrica de resumen (Total y Cantidad de ítems) */}
          <View className='flex-row justify-between mb-5'>
            <View className='flex-1 p-3 bg-gray-50 rounded-lg mr-2'>
              <Text className='text-xs text-gray-500 font-[Poppins-Regular]'>Total del Pedido</Text>
              <Text className='text-xl text-gray-900 mt-1 font-[Poppins-SemiBold]'>L. {orderData.docTotal.toFixed(2)}</Text>
            </View>
            <View className='flex-1 p-3 bg-gray-50 rounded-lg ml-2'>
              <Text className='text-xs text-gray-500 font-[Poppins-Regular]'>Items</Text>
              <Text className='text-xl font-[Poppins-SemiBold] text-gray-900 mt-1'>{totalItems}</Text>
            </View>
          </View>

          <TouchableOpacity className='w-full bg-black h-[50px] rounded-full flex-row gap-3 p-2 items-center justify-center'>
            <Entypo name="share" size={24} color="white" />
            <Text className='text-white font-[Poppins-SemiBold] tracking-[-0.3px]'>Compartir como PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de productos */}
        <View className='mt-5'>
          <Text className='text-xl mb-4 font-[Poppins-SemiBold]'>Productos</Text>
          {/* Aquí se cambia de 'documentLines' a 'lines' */}
          {orderData.lines.map((item, index) => (
            <View key={index} className='flex-row items-center bg-white p-3 rounded-lg mb-3 shadow-sm'>
              <View className='bg-gray-200 p-2 rounded-full mr-3'>
                <Ionicons name="bag-handle-outline" size={24} color="#6B7280" />
              </View>
              <View className='flex-1'>
                <Text className='text-base font-semibold font-[Poppins-Regular] tracking-[-0.3px]'>{item.itemDescription}</Text>
                <Text className='text-sm text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]'>Cantidad: {item.quantity}</Text>
              </View>
              <View className='items-end'>
                <Text className='text-base font-bold font-[Poppins-Regular] tracking-[-0.3px]'>L. {item.lineTotal.toFixed(2)}</Text>
                <Text className='text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]'>Precio Unitario: L. {item.priceAfterVAT.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderDetails;