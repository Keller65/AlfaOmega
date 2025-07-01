import { useLocalSearchParams } from 'expo-router';
import { Text, View, TouchableOpacity, Dimensions, TextInput, ScrollView } from 'react-native';
import React, { useState } from 'react';
import PlusIcon from "../assets/icons/PlusIcon"
import Minus from "../assets/icons/MinusIcon"

export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const [quantity, setQuantity] = useState<number>(1);
  return (
    <View style={{ flex: 1, padding: 10 }} className='bg-white relative'>
      <ScrollView className='flex-1'>
        <View className='h-[380px] w-full bg-gray-500'></View>
        <Text className='font-bold tracking-[-0.5px] leading-6 mt-10' style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>{params.itemName}</Text>

        <Text className='mb-2'>UPC: {params.itemCode}</Text>
        <Text className='mb-2'>Stock: {params.inStock}</Text>
        <Text className='mb-2'>Committed: {params.committed}</Text>
        <Text className='mb-2'>Precio: L.{params.price}</Text>
      </ScrollView>

      <View
        style={{ width: Dimensions.get('window').width }}
        className='w-full absolute bottom-0 p-5'>
        <View>
          <Text className='font-bold text-sm mb-2 font-[SpaceMono] leading-3'>Cantidad</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity
              onPress={() => setQuantity((q: number) => Math.max(1, q - 1))}
              className='bg-gray-200 px-3 py-1 rounded-l-md h-[40px] w-[40px] flex items-center justify-center'
            >
              <Minus size={18} />
            </TouchableOpacity>

            <TextInput
              keyboardType='numeric'
              className='border border-gray-300 p-2 text-center h-[40px]'
              style={{ width: 50 }}
              value={quantity.toString()}
              onChangeText={text => {
                const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                setQuantity(isNaN(num) ? 1 : Math.max(1, num));
              }}
            />

            <TouchableOpacity
              onPress={() => setQuantity((q: number) => q + 1)}
              className='bg-gray-200 px-3 py-1 rounded-r-md h-[40px] w-[40px] flex items-center justify-center'
            >
              <PlusIcon size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className='bg-blue-500 p-3 h-[50px] rounded-full items-center justify-center'
          onPress={() => {
            alert('Producto Agregado al carrito');
          }}
        >
          <Text className='text-white'>Agregar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
