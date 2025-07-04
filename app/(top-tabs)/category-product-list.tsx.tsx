import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Text, TouchableOpacity, View, TextInput, Alert, StyleSheet, Image } from 'react-native';
import { useAuth } from '../../context/auth';
import { ProductDiscount } from '../../types/types';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import "../../global.css";
import { useCartStore } from '@/state/index'; // Import the Zustand store

import MinusIcon from '../../assets/icons/MinusIcon';
import PlusIcon from '../../assets/icons/PlusIcon';

const CategoryProductScreen = memo(() => {
  const { user } = useAuth();
  const route = useRoute();
  const { groupName, groupCode } = route.params as { groupName?: string; groupCode?: string };

  // --- CORRECTED: Use the correct function names from the Zustand store ---
  const addProduct = useCartStore(state => state.addProduct);
  const updateQuantity = useCartStore(state => state.updateQuantity); // Changed from updateProductQuantity to updateQuantity
  const productsInCart = useCartStore(state => state.products);

  const [items, setItems] = useState<ProductDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProductDiscount | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [rawSearchText, setRawSearchText] = useState<string>('');
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>('');
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['69%', '76%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setSelectedItem(null);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(rawSearchText);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [rawSearchText]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      if (!user?.token) {
        setLoading(false);
        setError('No se ha iniciado sesión o el token no está disponible.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        };

        const [resGeneral, resDescuento] = await Promise.all([
          axios.get<ProductDiscount[]>('http://200.115.188.54:4325/sap/Items/Active', { headers }),
          axios.get<ProductDiscount[]>('http://200.115.188.54:4325/sap/items/discounted', { headers }),
        ]);

        const dataGeneral = resGeneral.data;
        const dataDescuento = Array.isArray(resDescuento.data) ? resDescuento.data : [];

        const descuentoMap = new Map<string, ProductDiscount>();
        for (const item of dataDescuento) {
          descuentoMap.set(item.itemCode, item);
        }

        const productosCombinados = dataGeneral.map((producto: ProductDiscount) => {
          if (descuentoMap.has(producto.itemCode)) {
            const descuento = descuentoMap.get(producto.itemCode);
            return {
              ...producto,
              tiers: descuento?.tiers || [],
              hasDiscount: true,
            };
          }
          return {
            ...producto,
            hasDiscount: false,
            tiers: [],
          };
        });

        setItems(productosCombinados);
      } catch (err: any) {
        console.error('Error al cargar productos con axios:', err);
        if (err.response) {
          setError(`Error del servidor: ${err.response.status} - ${err.response.data?.message || 'Mensaje desconocido'}`);
        } else if (err.request) {
          setError('No se pudo conectar al servidor. Verifica tu conexión.');
        } else {
          setError(`Ocurrió un error inesperado: ${err.message}`);
        }
        setItems([]);
      } finally {
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

  const handleProductPress = useCallback((item: ProductDiscount) => {
    setSelectedItem(item);
    setQuantity(1); // Reset quantity when a new product is selected
    bottomSheetModalRef.current?.present();
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedItem) {
      Alert.alert('Error', 'No hay producto seleccionado.');
      return;
    }
    if (quantity <= 0) {
      Alert.alert('Cantidad inválida', 'La cantidad debe ser mayor a cero.');
      return;
    }

    const itemInCart = productsInCart.find(p => p.itemCode === selectedItem.itemCode);

    // Prepare the product data for the store, omitting 'total' as the store calculates it
    const productDataForCart = {
      ...selectedItem,
      quantity: quantity,
      unitPrice: unitPrice, // Use the calculated unitPrice
    };

    if (itemInCart) {
      Alert.alert(
        'Producto ya en carrito',
        `"${selectedItem.itemName}" ya está en tu carrito. ¿Deseas actualizar la cantidad?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Actualizar',
            onPress: () => {
              // --- CORRECTED: Pass only itemCode and quantity to updateQuantity ---
              updateQuantity(selectedItem.itemCode, quantity);
              Alert.alert('Actualizado', `Cantidad de "${selectedItem.itemName}" actualizada en el carrito.`);
              bottomSheetModalRef.current?.dismiss();
            },
          },
        ]
      );
    } else {
      // --- CORRECTED: Pass productDataForCart (without total) to addProduct ---
      addProduct(productDataForCart);
      Alert.alert('Agregado', `"${selectedItem.itemName}" agregado al carrito.`);
      bottomSheetModalRef.current?.dismiss();
    }
  }, [selectedItem, quantity, unitPrice, addProduct, updateQuantity, productsInCart]); // Removed 'total' from dependencies as it's derived

  const filteredItems = useMemo(() => {
    let currentItems = Array.isArray(items) ? items : [];

    if (groupName && groupName !== 'Todas') {
      currentItems = currentItems.filter(item => item.groupName === groupName);
    } else if (groupCode && groupCode !== '0') {
      currentItems = currentItems.filter(item => item.groupCode.toString() === groupCode);
    }

    if (debouncedSearchText) {
      const text = debouncedSearchText.toLowerCase();
      currentItems = currentItems.filter((item) => {
        return (
          item.itemCode?.toLowerCase().includes(text) ||
          item.itemName?.toLowerCase().includes(text) ||
          item.groupName?.toLowerCase().includes(text)
        );
      });
    }
    return currentItems;
  }, [items, debouncedSearchText, groupName, groupCode]);

  const renderProductItem = useCallback(({ item, index }: { item: ProductDiscount; index: number }) => (
    <TouchableOpacity
      key={item.itemCode || index}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
      className="mb-4 bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <View className='flex-row gap-3 p-3'>
        <View className='size-[100px] rounded-lg bg-gray-200 flex items-center justify-center'>
          <Image
            source={{ uri: "https://res.cloudinary.com/dorcubmfk/image/upload/v1751675261/bote_de_chile_tabasco_1_galon_qaly7a.png" }}
            style={{ width: 100, height: 100 }}
            resizeMode="contain"
          />
        </View>

        <View className='flex-1 justify-center'>
          <Text className='font-[Poppins-SemiBold] text-base leading-5 mb-1'>{item.itemName}</Text>
          <Text className='font-[Poppins-Medium] text-sm text-gray-600'>Código: {item.itemCode}</Text>
          <Text className='font-[Poppins-Regular] text-sm text-gray-600'>Stock: {item.inStock}</Text>
          <Text className='font-[Poppins-Regular] text-sm text-gray-600'>Committed: {item.committed}</Text>
          <Text className='font-[Poppins-Regular] text-sm text-gray-800'>Precio Base: L.{item.price.toFixed(2)}</Text>

          <Text className='font-[Poppins-SemiBold] text-sm text-blue-700 mt-1'>Disponible: {item.inStock - item.committed}</Text>

          {item.tiers && item.tiers.length > 0 ? (
            <View className="mt-1">
              <Text className='font-[Poppins-Regular] text-xs text-gray-600'>Precios por cantidad:</Text>
              {item.tiers.map((tier, i) => (
                <Text key={i} className='font-[Poppins-Regular] text-xs text-gray-500'>
                  {`   • Desde ${tier.qty}u: L. ${tier.price.toFixed(2)} (${tier.percent}% desc)`}
                </Text>
              ))}
            </View>
          ) : (
            <Text className='font-[Poppins-Regular] text-xs text-gray-500 mt-1'>Sin precios escalonados</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [handleProductPress]);

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
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.subText}>Por favor, intenta de nuevo más tarde.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View className="px-4 py-2 bg-white border-b border-gray-200">
        <TextInput
          className="h-12 border border-gray-300 rounded-lg px-4 font-[Poppins-Regular]"
          placeholder="Buscar productos..."
          value={rawSearchText}
          onChangeText={setRawSearchText}
          clearButtonMode="while-editing"
        />
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.fullScreenCenter}>
          <Text className="text-center text-gray-500 mt-4">
            No se encontraron productos para "{rawSearchText}" en esta categoría.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.itemCode}
          contentContainerStyle={{ padding: 16 }}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={21}
        />
      )}

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
          }}
        >
          {selectedItem ? (
            <View className="w-full px-4 gap-y-8">
              <View>
                <View className='w-full h-[200px] flex items-center justify-center bg-gray-200 rounded-xl mb-4'>
                  <Image
                    source={{ uri: "https://res.cloudinary.com/dorcubmfk/image/upload/v1751675261/bote_de_chile_tabasco_1_galon_qaly7a.png" }}
                    style={{ width: 200, height: 200 }}
                    resizeMode="contain"
                  />
                </View>

                <Text className="text-xl font-semibold mb-2">{selectedItem.itemName}</Text>
                <Text>UPC: {selectedItem.itemCode}</Text>
                <Text>Stock: {selectedItem.inStock}</Text>
                <Text>Committed: {selectedItem.committed}</Text>
                <Text>Precio base: L.{selectedItem.price.toFixed(2)}</Text>

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
                  <View className="flex-row items-center mt-4 mb-2">
                    <TouchableOpacity
                      className="bg-gray-200 rounded-full p-2"
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <MinusIcon size={20} />
                    </TouchableOpacity>
                    <TextInput
                      value={quantity.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                        setQuantity(!isNaN(num) ? Math.max(1, num) : 1); // No stock limit here
                      }}
                      keyboardType="numeric"
                      style={{
                        width: 48,
                        textAlign: 'center',
                        fontSize: 18,
                        marginHorizontal: 16,
                        color: 'black',
                      }}
                    />
                    <TouchableOpacity
                      className="bg-gray-200 rounded-full p-2"
                      onPress={() => setQuantity((q) => q + 1)} // No stock limit here
                    >
                      <PlusIcon size={20} />
                    </TouchableOpacity>
                  </View>

                  <View className="mt-2 mb-2 w-[126px]">
                    <Text className="text-base text-gray-500 font-[Poppins-Regular] leading-4">Total</Text>
                    <Text className="text-2xl font-[Poppins-Bold] leading-6">L.{total.toFixed(2)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  className="mt-2 bg-blue-600 rounded-lg py-3 items-center"
                  onPress={handleAddToCart}
                  disabled={quantity <= 0}
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
  );
});

export default CategoryProductScreen;

const styles = StyleSheet.create({
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
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 5,
  },
  subText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
});