import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, TextInput, Alert, Image, RefreshControl } from 'react-native';
import { useAuth } from '../../context/auth';
import { ProductDiscount } from '../../types/types';
import { useRoute } from '@react-navigation/native';
import { useAppStore } from '@/state/index';
import axios from 'axios';
import MinusIcon from '../../assets/icons/MinusIcon';
import PlusIcon from '../../assets/icons/PlusIcon';

const PAGE_SIZE = 20;

const CategoryProductScreen = memo(() => {
  const { user } = useAuth();
  const route = useRoute();
  const { groupCode } = route.params as { groupCode?: string };

  const addProduct = useAppStore(state => state.addProduct);
  const updateQuantity = useAppStore(state => state.updateQuantity);
  const productsInCart = useAppStore(state => state.products);
  const allProductsCache = useAppStore(state => state.allProductsCache);
  const setAllProductsCache = useAppStore(state => state.setAllProductsCache);
  const debouncedSearchText = useAppStore(state => state.debouncedSearchText);

  const [items, setItems] = useState<ProductDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProductDiscount | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const snapPoints = useMemo(() => ['69%', '76%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setSelectedItem(null);
  }, []);

  const fetchAllProducts = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      };
      const allItems: ProductDiscount[] = [];
      let currentPage = 1;
      let totalFetched = 0;
      while (true) {
        const res = await axios.get(`http://200.115.188.54:4325/sap/items/active?page=${currentPage}&pageSize=${PAGE_SIZE}&groupCode=${groupCode}`, { headers });
        const data = res.data.items;
        if (data.length === 0) break;
        allItems.push(...data);
        totalFetched += data.length;
        if (totalFetched >= res.data.total) break;
        currentPage++;
      }
      const resDescuento = await axios.get('http://200.115.188.54:4325/sap/items/discounted', { headers });
      const dataDescuento = Array.isArray(resDescuento.data) ? resDescuento.data : [];
      const descuentoMap = new Map(dataDescuento.map((d: ProductDiscount) => [d.itemCode, d]));
      const productosCombinados = allItems.map((producto: ProductDiscount) => {
        const descuento = descuentoMap.get(producto.itemCode);
        return {
          ...producto,
          tiers: descuento?.tiers || [],
          hasDiscount: !!descuento,
        };
      });
      setItems(productosCombinados);
      setAllProductsCache(productosCombinados);
      setTotalItems(productosCombinados.length);
    } catch (err) {
      setError('Error al cargar productos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, groupCode]);

  const fetchProducts = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      };
      const res = await axios.get(`http://200.115.188.54:4325/sap/items/active?page=1&pageSize=${PAGE_SIZE}&groupCode=${groupCode}`, { headers });
      const newItems = res.data.items;
      const resDescuento = await axios.get('http://200.115.188.54:4325/sap/items/discounted', { headers });
      const dataDescuento = Array.isArray(resDescuento.data) ? resDescuento.data : [];
      const descuentoMap = new Map(dataDescuento.map((d: ProductDiscount) => [d.itemCode, d]));
      const productosCombinados = newItems.map((producto: ProductDiscount) => {
        const descuento = descuentoMap.get(producto.itemCode);
        return {
          ...producto,
          tiers: descuento?.tiers || [],
          hasDiscount: !!descuento,
        };
      });
      setItems(productosCombinados);
      setAllProductsCache(productosCombinados);
      setTotalItems(res.data.total);
    } catch (err) {
      setError('Error al cargar productos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, groupCode]);

  useEffect(() => {
    if (debouncedSearchText) {
      fetchAllProducts();
    } else {
      fetchProducts();
    }
  }, [groupCode, debouncedSearchText]);

  useEffect(() => {
    if (!selectedItem) return setTotal(0);
    let newUnitPrice = selectedItem.price;
    const applicable = selectedItem.tiers?.filter(t => quantity >= t.qty).sort((a, b) => b.qty - a.qty)[0];
    if (applicable) newUnitPrice = applicable.price;
    setUnitPrice(newUnitPrice);
    setTotal(newUnitPrice * quantity);
  }, [selectedItem, quantity]);

  const onRefresh = () => {
    setRefreshing(true);
    if (debouncedSearchText) {
      fetchAllProducts();
    } else {
      fetchProducts();
    }
  };

  const handleProductPress = (item: ProductDiscount) => {
    setSelectedItem(item);
    setQuantity(1);
    bottomSheetModalRef.current?.present();
  };

  const handleAddToCart = () => {
    if (!selectedItem || quantity <= 0) return;
    const itemInCart = productsInCart.find(p => p.itemCode === selectedItem.itemCode);
    const productData = { ...selectedItem, quantity, unitPrice };
    if (itemInCart) {
      Alert.alert(
        'Producto ya en carrito',
        `${selectedItem.itemName} ya está en tu carrito. ¿Actualizar cantidad?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Actualizar',
            onPress: () => {
              updateQuantity(selectedItem.itemCode, quantity);
              bottomSheetModalRef.current?.dismiss();
            },
          },
        ]
      );
    } else {
      addProduct(productData);
      bottomSheetModalRef.current?.dismiss();
    }
  };

  const filteredItems = useMemo(() => {
    const text = debouncedSearchText?.toLowerCase() || '';
    return items.filter(item =>
      item.itemCode?.toLowerCase().includes(text) ||
      item.itemName?.toLowerCase().includes(text) ||
      item.groupName?.toLowerCase().includes(text)
    );
  }, [items, debouncedSearchText]);

  const renderProductItem = ({ item }: { item: ProductDiscount }) => (
    <TouchableOpacity onPress={() => handleProductPress(item)} className="mb-4 bg-white w-[190px]">
      <View className="gap-3 p-2">
        <View className="rounded-2xl bg-gray-100 items-center justify-center h-[180px]">
          <Image source={{ uri: 'https://via.placeholder.com/150' }} className="w-[150px] h-[150px]" resizeMode="contain" />
        </View>
        <View>
          <Text className="font-medium text-sm text-black">L. {item.price}</Text>
          <Text className="font-medium text-sm leading-4">{item.itemName.toLowerCase()}</Text>
          <Text className="text-[10px] text-gray-400">COD: {item.itemCode}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user?.token) return <View className="flex-1 justify-center items-center bg-white px-5"><Text className="text-red-500">No has iniciado sesión.</Text></View>;
  if (loading && items.length === 0) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator size="large" color="#007bff" /><Text>Cargando productos...</Text></View>;
  if (error && items.length === 0) return <View className="flex-1 justify-center items-center bg-white px-4"><Text className="text-red-500">{error}</Text></View>;

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={filteredItems}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.itemCode}
        numColumns={2}
        className='flex-1'
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} pressBehavior="close" />
        )}
      >
        <BottomSheetView className="flex-1 items-center">
          {selectedItem && (
            <View className="w-full px-4 space-y-6">
              <View>
                <View className="w-full h-[200px] items-center justify-center bg-gray-200 rounded-xl mb-4">
                  <Image source={{ uri: 'https://via.placeholder.com/200' }} className="w-[200px] h-[200px]" resizeMode="contain" />
                </View>
                <Text className="text-xl font-semibold mb-1">{selectedItem.itemName}</Text>
                <Text>UPC: {selectedItem.itemCode}</Text>
                <Text>Stock: {selectedItem.inStock}</Text>
                <Text>Committed: {selectedItem.committed}</Text>
                <Text>Precio base: L.{selectedItem.price.toFixed(2)}</Text>
                {selectedItem.tiers?.length > 0 && (
                  <View className="bg-gray-100 p-3 rounded-lg mt-4">
                    <Text className="font-semibold mb-1">Precios por cantidad:</Text>
                    {selectedItem.tiers.map((tier, index) => (
                      <Text key={index} className="text-sm text-gray-700">
                        Desde {tier.qty} unidades: L. {tier.price.toFixed(2)} ({tier.percent}% desc)
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              <View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <TouchableOpacity className="bg-gray-200 rounded-full p-2" onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                      <MinusIcon size={20} />
                    </TouchableOpacity>
                    <TextInput
                      value={quantity.toString()}
                      onChangeText={(text) => setQuantity(Math.max(1, parseInt(text.replace(/[^0-9]/g, '')) || 1))}
                      keyboardType="numeric"
                      className="mx-4 text-center text-lg text-black w-12"
                    />
                    <TouchableOpacity className="bg-gray-200 rounded-full p-2" onPress={() => setQuantity(q => q + 1)}>
                      <PlusIcon size={20} />
                    </TouchableOpacity>
                  </View>
                  <View className="w-[126px]">
                    <Text className="text-base text-gray-500">Total</Text>
                    <Text className="text-2xl font-bold">L.{total.toFixed(2)}</Text>
                  </View>
                </View>
                <TouchableOpacity className="mt-4 bg-blue-600 rounded-lg py-3 items-center" onPress={handleAddToCart}>
                  <Text className="text-white font-bold">Agregar al carrito</Text>
                </TouchableOpacity>
                <Text className="text-xs text-gray-500 mt-2">Precio unitario aplicado: L.{unitPrice.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
});

export default CategoryProductScreen;
