import { useAppStore } from '@/state/index';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MinusIcon from '../../assets/icons/MinusIcon';
import PlusIcon from '../../assets/icons/PlusIcon';
import { useAuth } from '../../context/auth';
import { ProductDiscount } from '../../types/types';

const PAGE_SIZE = 20;

const ProductItem = memo(({ item, onPress }: { item: ProductDiscount, onPress: (item: ProductDiscount) => void }) => {
  const itemInCart = useAppStore(state =>
    state.products.find(p => p.itemCode === item.itemCode)
  );

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="mb-4 bg-white w-[190px] relative"
    >
      {itemInCart && (
        <View className="absolute top-1 right-1 bg-blue-500 rounded-full w-6 h-6 items-center justify-center z-10">
          <Text className="text-white text-xs font-bold">{itemInCart.quantity}</Text>
        </View>
      )}
      <View className="gap-3 p-2">
        <View className="rounded-2xl bg-gray-100 items-center justify-center h-[180px]">
          <Image
            source={{ uri: 'https://pub-978b0420802d40dca0561ef586d321f7.r2.dev/bote%20de%20chile%20tabasco%201%20galon.png' }}
            className="w-[150px] h-[150px]"
            resizeMode="contain"
          />
        </View>
        <View>
          <Text className="font-medium text-sm text-black">L. {item.price.toFixed(2)}</Text>
          <Text
            className="font-medium text-sm leading-4"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.itemName.toLowerCase()}
          </Text>
          <Text className="text-[10px] text-gray-400">COD: {item.itemCode}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const CategoryProductScreen = memo(() => {
  const { user } = useAuth();
  const route = useRoute();
  const { groupCode, priceListNum } = route.params as { groupCode?: string, priceListNum?: string };

  const addProduct = useAppStore(state => state.addProduct);
  const updateQuantity = useAppStore(state => state.updateQuantity);
  const productsInCart = useAppStore(state => state.products);
  const debouncedSearchText = useAppStore(state => state.debouncedSearchText);

  const pagesCacheRef = useRef<Map<number, ProductDiscount[]>>(new Map());

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

  const fetchProducts = useCallback(async ({ forceRefresh = false, loadMore = false } = {}) => {
    if (!user?.token) {
      setLoading(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }

    const currentPage = loadMore ? page : 1;

    if (!forceRefresh && !loadMore && pagesCacheRef.current.has(currentPage)) {
      setItems(Array.from(pagesCacheRef.current.values()).flat());
      setLoading(false);
      return;
    }

    loadMore ? setLoadingMore(true) : setLoading(true);
    setError(null);

    try {
      const headers = {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      };

      let url = `http://200.115.188.54:4325/sap/items/active?page=${currentPage}&pageSize=${PAGE_SIZE}`;

      if (priceListNum) {
        url += `&priceList=${priceListNum}`;
      }

      if (groupCode) {
        url += `&groupCode=${groupCode}`;
      }

      const itemsResponse = await axios.get(url, { headers });

      const newItems = itemsResponse.data.items;

      if (forceRefresh) {
        pagesCacheRef.current = new Map();
      }
      pagesCacheRef.current.set(currentPage, newItems);

      setItems(prevItems =>
        loadMore ? [...prevItems, ...newItems] : Array.from(pagesCacheRef.current.values()).flat()
      );

      setPage(currentPage);
      setTotalItems(itemsResponse.data.total);

    } catch (err: any) {
      setError(err?.message || 'Error inesperado');
      if (!loadMore) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user?.token, groupCode, priceListNum, page]);

  useEffect(() => {
    // Resetear cache y estado cuando cambian filtros 
    pagesCacheRef.current = new Map();
    setItems([]);
    setPage(1);
    setLoading(true);
    fetchProducts();
  }, [groupCode, priceListNum, fetchProducts]);

  useEffect(() => {
    if (!selectedItem) {
      setTotal(0);
      return;
    }
    let newUnitPrice = selectedItem.price;
    const applicable = selectedItem.tiers?.filter(t => quantity >= t.qty).sort((a, b) => b.qty - a.qty)[0];
    if (applicable) newUnitPrice = applicable.price;
    setUnitPrice(newUnitPrice);
    setTotal(newUnitPrice * quantity);
  }, [selectedItem, quantity]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    pagesCacheRef.current = new Map();
    setPage(1);
    fetchProducts({ forceRefresh: true });
  }, [fetchProducts]);

  const loadMoreItems = useCallback(() => {
    if (!loadingMore && items.length < totalItems) {
      setPage(prev => prev + 1);
    }
    if (!loadingMore && items.length >= totalItems && items.length % PAGE_SIZE === 0) {
      setPage(prev => prev + 1);
    }
  }, [loadingMore, items.length, totalItems]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts({ loadMore: true });
    }
  }, [page, fetchProducts]);

  const handleProductPress = useCallback((item: ProductDiscount) => {
    setSelectedItem(item);
    setQuantity(1);
    bottomSheetModalRef.current?.present();
    console.log('Producto seleccionado:', item);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedItem || quantity <= 0) return;
    const itemInCart = productsInCart.find(p => p.itemCode === selectedItem.itemCode);
    const productData = { ...selectedItem, quantity, unitPrice };

    console.log("Producto agregado al carrito:", productData);

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
  }, [addProduct, productsInCart, quantity, selectedItem, unitPrice, updateQuantity]);

  const filteredItems = useMemo(() => {
    const text = debouncedSearchText?.toLowerCase() || '';
    return items.filter(item =>
      item.itemCode?.toLowerCase().includes(text) ||
      item.itemName?.toLowerCase().includes(text) ||
      item.groupName?.toLowerCase().includes(text)
    );
  }, [items, debouncedSearchText]);

  const renderItem = useCallback(({ item }: { item: ProductDiscount }) => (
    <ProductItem item={item} onPress={handleProductPress} />
  ), [handleProductPress]);

  if (loading && !loadingMore) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Cargando productos...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text className="text-blue-500">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlashList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.itemCode}
        estimatedItemSize={200}
        numColumns={2}
        onEndReached={loadMoreItems}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingBottom: 20,
        }}
        drawDistance={500}
        overrideItemLayout={(layout, item) => {
          layout.size = 100;
        }}
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
                  <Image
                    source={{ uri: 'https://pub-978b0420802d40dca0561ef586d321f7.r2.dev/bote%20de%20chile%20tabasco%201%20galon.png' }}
                    className="w-[200px] h-[200px]"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-[20px] font-[Poppins-Bold] mb-2 tracking-[-0.3px] leading-6">{selectedItem.itemName}</Text>
                <Text className="font-[Poppins-SemiBold] text-sm tracking-[-0.3px] text-gray-500">Codigo: {selectedItem.itemCode}</Text>
                <Text className="font-[Poppins-SemiBold] text-sm tracking-[-0.3px] text-gray-500">Stock: {selectedItem.inStock}</Text>
                <Text className="font-[Poppins-SemiBold] text-sm tracking-[-0.3px] text-gray-500">Precio base: L.{selectedItem.price.toFixed(2)}</Text>
                {selectedItem.tiers?.length > 0 && (
                  <View className="bg-gray-100 p-3 rounded-lg mt-4">
                    <Text className="font-[Poppins-SemiBold] tracking-[-0.3px] mb-1">Precios por cantidad:</Text>
                    {selectedItem.tiers.map((tier, index) => (
                      <Text key={index} className="font-[Poppins-Regular] text-sm tracking-[-0.3px] text-gray-700">
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
                    <Text className="font-[Poppins-Bold] text-gray-500 tracking-[-0.3px]">Total</Text>
                    <Text className="text-2xl font-[Poppins-Bold] tracking-[-0.3px]">L.{total.toFixed(2)}</Text>
                  </View>
                </View>

                <TouchableOpacity className="mt-4 bg-blue-600 rounded-lg py-3 items-center" onPress={handleAddToCart}>
                  <Text className="text-white font-[Poppins-Bold]">Agregar al carrito</Text>
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
