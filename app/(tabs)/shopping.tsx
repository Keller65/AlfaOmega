import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/auth';
import "../../global.css";

import MinusIcon from '../../assets/icons/MinusIcon';
import PlusIcon from '../../assets/icons/PlusIcon';

export default function Shopping() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['45%', '70%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setSelectedItem(null); // Limpiar al cerrar
  }, []);

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

  useEffect(() => {
    const fetchDiscounted = async () => {
      try {
        const res = await fetch('http://200.115.188.54:4325/sap/items/discounted', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: user?.token }),
        });
        let data = null;
        const text = await res.text();
        if (text) {
          data = JSON.parse(text);
          console.log('Discounted items:', data);
        } else {
          console.warn('La respuesta de productos en descuento estaba vacía');
        }
      } catch (e) {
        console.error('Error fetching discounted items', e);
      }
    };
    if (user?.token) fetchDiscounted();
  }, [user?.token]);

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
  const handleProductPress = (item: any) => {
    setSelectedItem(item);
    setQuantity(1);
    bottomSheetModalRef.current?.present();
  };

  const handleAddToCart = async () => {
    try {
      const existing = await AsyncStorage.getItem('products');
      let products = [];
      if (existing) {
        products = JSON.parse(existing);
      }
      // Evita duplicados por itemCode
      if (!products.some((p: any) => p.itemCode === selectedItem.itemCode)) {
        products.push(selectedItem);
        await AsyncStorage.setItem('products', JSON.stringify(products));
        console.log('Producto agregado al carrito:', selectedItem);
        console.log('Productos actuales en carrito:', products);
      } else {
        console.log('El producto ya está en el carrito:', selectedItem);
      }
    } catch (e) {
      console.error('Error al guardar en AsyncStorage', e);
    }
  }

  return (
    <ScrollView>
      <View className='relative w-full h-[180px]'>
        <View className='absolute inset-0 bg-[#00000077] z-10 flex items-center justify-center'>
          <Text className='text-white text-3xl font-bold p-4 font-[Poppins-Medium] mt-4 w-[260px] text-center leading-6'>Productos en Descuento</Text>
        </View>
        <Image
          className='w-full aspect-auto object-contain'
          source={require('../../assets/images/market.jpeg')}
          style={{ width: Dimensions.get('window').width, height: 180 }}
        />
      </View>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetView
          style={{
            flex: 1,
            minHeight: Dimensions.get('window').height * 0.35,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selectedItem ? (
            <View className="w-full px-6">
              <Text className="text-lg font-semibold mb-2">{selectedItem.itemName}</Text>
              <Text>UPC: {selectedItem.itemCode}</Text>
              <Text>Stock: {selectedItem.inStock}</Text>
              <Text>Committed: {selectedItem.committed}</Text>
              <Text>Precio: L.{selectedItem.price}</Text>

              {/* Selector de cantidad */}
              <View className="flex-row items-center mt-4 mb-2">
                <TouchableOpacity
                  className="bg-gray-200 rounded-full p-2"
                  onPress={() => setQuantity((q: number) => Math.max(1, q - 1))}
                >
                  <MinusIcon />
                </TouchableOpacity>
                <Text className="mx-4 text-lg">{quantity}</Text>
                <TouchableOpacity
                  className="bg-gray-200 rounded-full p-2"
                  onPress={() => setQuantity((q: number) => Math.min(selectedItem.inStock || 99, q + 1))}
                >
                  <PlusIcon />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="mt-2 bg-blue-600 rounded-lg py-3 items-center"
                onPress={handleAddToCart}
              >
                <Text className="text-white font-bold">Agregar al carrito</Text>
              </TouchableOpacity>
              <View className="mt-2">
                <Text className="text-xs text-gray-500">Producto seleccionado:</Text>
                <Text className="text-sm">{JSON.stringify({ ...selectedItem, quantity }, null, 2)}</Text>
              </View>
            </View>
          ) : (
            <Text className="text-lg font-semibold">Selecciona un producto</Text>
          )}

        </BottomSheetView>
      </BottomSheetModal>

      <View className='p-4'>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.itemCode || idx}
            onPress={() => handleProductPress(item)}
            activeOpacity={0.7}
          >
            <View className='flex-row gap-3' style={{ marginBottom: 16 }}>
              <View className='size-[140px] rounded-xl bg-gray-300'></View>
              <View className='flex-1 flex justify-center'>
                <Text className='font-bold text-lg leading-4'>{item.itemName}</Text>
                <Text>UPC: {item.itemCode}</Text>
                <Text>Stock: {item.inStock}</Text>
                <Text>Committed: {item.committed}</Text>
                <Text>Precio: L.{item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}