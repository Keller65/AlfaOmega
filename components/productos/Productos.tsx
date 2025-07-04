import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useAuth } from '../../context/auth';
import { ProductDiscount } from '../../types/types';
import axios from 'axios';
import "../../global.css";

import MinusIcon from '../../assets/icons/MinusIcon';
import PlusIcon from '../../assets/icons/PlusIcon';

export default function Product() {
  const { user } = useAuth();
  const [items, setItems] = useState<ProductDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ProductDiscount | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['69%', '76%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setSelectedItem(null);
  }, []);

  useEffect(() => {
    const fetchAllProducts = async () => {
      if (!user?.token) return;

      try {
        const headers = {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        };

        const [resGeneral, resDescuento] = await Promise.all([
          axios.get('http://200.115.188.54:4325/sap/Items/Active', { headers }),
          axios.get('http://200.115.188.54:4325/sap/items/discounted', { headers }),
        ]);

        const dataGeneral = resGeneral.data;
        const dataDescuento = Array.isArray(resDescuento.data) ? resDescuento.data : [];

        const descuentoMap = new Map<string, any>();
        for (const item of dataDescuento) {
          descuentoMap.set(item.itemCode, item);
        }

        const productosCombinados = dataGeneral.map((producto: any) => {
          if (descuentoMap.has(producto.itemCode)) {
            const descuento = descuentoMap.get(producto.itemCode);
            return {
              ...producto,
              tiers: descuento.tiers,
              hasDiscount: true,
            };
          }
          return {
            ...producto,
            hasDiscount: false,
          };
        });

        setItems(productosCombinados);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar productos con axios:', error);
        setItems([]);
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, [user?.token]);

  useEffect(() => {
    if (!selectedItem) {
      setUnitPrice(0);
      setTotal(0);
      return;
    }

    let newUnitPrice = selectedItem.price;
    if (selectedItem.tiers && selectedItem.tiers.length > 0) {
      const applicableTier = selectedItem.tiers
        .filter((tier: any) => quantity >= tier.qty)
        .sort((a: any, b: any) => b.qty - a.qty)[0];
      if (applicableTier) {
        newUnitPrice = applicableTier.price;
      }
    }
    setUnitPrice(newUnitPrice);
    setTotal(newUnitPrice * quantity);
  }, [selectedItem, quantity]);

  const handleProductPress = (item: ProductDiscount) => {
    setSelectedItem(item);
    setQuantity(1);
    bottomSheetModalRef.current?.present();
  };

  const handleAddToCart = async () => {
    try {
      if (!selectedItem) return;

      const existing = await AsyncStorage.getItem('products');
      let products = existing ? JSON.parse(existing) : [];

      if (!products.some((p: any) => p.itemCode === selectedItem.itemCode)) {
        products.push({ ...selectedItem, quantity, unitPrice, total });
        await AsyncStorage.setItem('products', JSON.stringify(products));
        console.log('Producto agregado al carrito:', selectedItem);
      } else {
        console.log('El producto ya está en el carrito:', selectedItem);
      }
    } catch (e) {
      console.error('Error al guardar en AsyncStorage', e);
    }
  };

  const filteredItems = Array.isArray(items)
    ? items.filter((item) => {
      const text = searchText.toLowerCase();
      return (
        item.itemCode?.toLowerCase().includes(text) ||
        item.itemName?.toLowerCase().includes(text) ||
        item.groupName?.toLowerCase().includes(text)
      );
    })
    : [];

  if (!user?.token) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No has iniciado sesión. Ingresa para ver los productos.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView>
      <View>
        {/* Banner */}
        <View className='relative w-full h-[180px]'>
          <View className='absolute inset-0 bg-[#00000077] z-10 flex items-center justify-center'>
            <Text className='text-white text-3xl font-bold p-4 font-[Poppins-Medium] mt-4 w-[260px] text-center leading-6'>
              Productos en Descuento
            </Text>
          </View>
          <Image
            source={require('../../assets/images/market.jpeg')}
            style={{ width: Dimensions.get('window').width, height: 180 }}
          />
        </View>

        {/* Buscador */}
        <View className="p-4">
          <TextInput
            placeholder="Buscar por UPC o nombre del producto"
            className="rounded-3xl px-4 py-3 h-[52px] text-base border-2 shadow-sm bg-white border-transparent"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Buscar productos"
          />
        </View>

        {/* Lista de productos filtrados */}
        <View className='p-4'>
          {filteredItems.length === 0 ? (
            <Text className="text-center text-gray-500">No se encontraron productos.</Text>
          ) : (
            filteredItems.map((item, idx) => (
              <TouchableOpacity
                key={item.itemCode || idx}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.7}
              >
                <View className='flex-row gap-3 mb-4'>
                  <View className='size-[140px] rounded-xl bg-gray-300' />
                  <View className='flex-1 justify-center'>
                    <Text className='font-[Poppins-SemiBold] text-lg leading-4'>{item.itemName}</Text>
                    <Text className='font-[Poppins-Medium]'>UPC: {item.itemCode}</Text>
                    <Text className='font-[Poppins-Regular]'>Stock: {item.inStock}</Text>
                    <Text className='font-[Poppins-Regular]'>Precio: L.{item.price.toFixed(2)}</Text>
                    {item.tiers?.length > 0 ? (
                      <View>
                        <Text className='font-[Poppins-Regular]'>Precios por cantidad:</Text>
                        {item.tiers.map((tier, i) => (
                          <Text key={i} className='font-[Poppins-Regular] text-xs'>
                            {`Desde ${tier.qty}u: L. ${tier.price.toFixed(2)} (${tier.percent}% desc)`}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <Text className='font-[Poppins-Regular]'>Precio Descuento: No disponible</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* MODAL */}
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
              minHeight: Dimensions.get('window').height * 0.67,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selectedItem ? (
              <View className="w-full px-4 gap-y-8">
                <View>
                  <View className='w-full h-[200px] bg-gray-200 rounded-xl mb-4' />
                  <Text className="text-xl font-semibold mb-2">{selectedItem.itemName}</Text>
                  <Text>UPC: {selectedItem.itemCode}</Text>
                  <Text>Stock: {selectedItem.inStock}</Text>
                  <Text>Committed: {selectedItem.committed}</Text>
                  <Text>Precio base: L.{selectedItem.price.toFixed(2)}</Text>

                  {/* Precios por cantidad */}
                  {(selectedItem.tiers && selectedItem.tiers.length > 0) && (
                    <View className="bg-gray-100 p-3 rounded-lg mt-4">
                      <Text className="font-[Poppins-Medium] mb-1">Precios por cantidad:</Text>
                      {selectedItem.tiers.map((tier, index) => (
                        <Text key={index} className="text-sm text-gray-700">
                          {`Desde ${tier.qty} unidades: L. ${tier.price.toFixed(2)} (${tier.percent}% desc)`}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                <View>
                  <View className='flex-row items-center justify-between w-full'>
                    {/* Selector de cantidad */}
                    <View className="flex-row items-center mt-4 mb-2">
                      <TouchableOpacity
                        className="bg-gray-200 rounded-full p-2"
                        onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                      >
                        <MinusIcon size={20} />
                      </TouchableOpacity>
                      <TextInput
                        value={quantity.toString()}
                        onChangeText={(text) => {
                          const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                          setQuantity(!isNaN(num) ? Math.max(1, num) : 1);
                        }}
                        keyboardType="numeric"
                        style={{
                          width: 48,
                          textAlign: 'center',
                          fontSize: 18,
                          marginHorizontal: 16,
                          color: 'black',
                        }}
                        maxLength={5}
                      />
                      <TouchableOpacity
                        className="bg-gray-200 rounded-full p-2"
                        onPress={() => setQuantity((q) => q + 1)}
                      >
                        <PlusIcon size={20} />
                      </TouchableOpacity>
                    </View>

                    {/* Precio unitario aplicado y total */}
                    <View className="mt-2 mb-2 w-[126px]">
                      <Text className="text-base text-gray-500 font-[Poppins-Regular] leading-4">Total</Text>
                      <Text className="text-2xl font-[Poppins-Bold] leading-6">{total.toFixed(2)}</Text>
                    </View>
                  </View>

                  {/* Botón Agregar */}
                  <TouchableOpacity
                    className="mt-2 bg-blue-600 rounded-lg py-3 items-center"
                    onPress={handleAddToCart}
                  >
                    <Text className="text-white font-bold">Agregar al carrito</Text>
                  </TouchableOpacity>

                  {unitPrice && <Text className="text-sm text-gray-500 font-[Poppins-Regular] mt-2">Precio unitario aplicado: L.{unitPrice.toFixed(2)}</Text>}
                </View>
              </View>
            ) : (
              <Text className="text-lg font-semibold">Selecciona un producto</Text>
            )}
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    </ScrollView>
  );
}
