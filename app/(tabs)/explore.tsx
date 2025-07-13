import { useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import PlusIcon from '@/assets/icons/PlusIcon';
import CartIcon from '@/assets/icons/CartIcon';
import MinusIcon from '@/assets/icons/MinusIcon';
import TrashIcon from '@/assets/icons/TrashIcon';
import { useAppStore } from '@/state/index';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFooter, BottomSheetFlatList, BottomSheetFooterProps, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import '../../global.css';

interface CartItemType {
  itemCode: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface CartItemProps {
  item: CartItemType;
  onUpdateQty: (code: string, qty: number) => void;
  onRemove: (code: string, name: string) => void;
}

const snapPoints: string[] = ['60%', '85%'];

const areEqual = (prev: CartItemProps, next: CartItemProps) =>
  prev.item.itemCode === next.item.itemCode &&
  prev.item.quantity === next.item.quantity &&
  prev.item.total === next.item.total;

const CartItem = memo(({ item, onUpdateQty, onRemove }: CartItemProps) => {
  const removeRequested = useRef(false);

  const handleChange = useCallback((type: 'add' | 'sub') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQty = type === 'add' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
    onUpdateQty(item.itemCode, newQty);
  }, [item, onUpdateQty]);

  const handleRemove = useCallback(() => {
    if (removeRequested.current) return;
    removeRequested.current = true;
    onRemove(item.itemCode, item.itemName);
  }, [item, onRemove]);

  return (
    <View className="mb-3 border-b pb-3 border-gray-200 px-4">
      <View className="flex-row gap-4 items-center">
        <View className="size-[100px] bg-gray-200 rounded-lg items-center justify-center">
          <Text className="text-gray-400">Imagen</Text>
        </View>

        <View className="flex-1">
          <Text className="font-[Poppins-SemiBold] tracking-[-0.3px]" numberOfLines={2}>{item.itemName.toLowerCase()}</Text>

          <View className="flex-row items-center my-2 gap-2">
            <TouchableOpacity
              onPress={() => handleChange('sub')}
              className="bg-gray-200 p-2 rounded-full"
              disabled={item.quantity <= 1}
            >
              <MinusIcon size={16} color={item.quantity <= 1 ? "#ccc" : "#000"} />
            </TouchableOpacity>

            <TextInput
              className="border border-gray-300 rounded-md px-2 py-1 text-center w-[50px] text-black"
              keyboardType="numeric"
              value={String(item.quantity)}
              onChangeText={(text) => {
                const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(num)) onUpdateQty(item.itemCode, Math.max(1, num));
              }}
              maxLength={3}
            />

            <TouchableOpacity
              onPress={() => handleChange('add')}
              className="bg-gray-200 p-2 rounded-full"
            >
              <PlusIcon size={16} />
            </TouchableOpacity>
          </View>

          <Text className="text-sm font-[Poppins-Regular] text-gray-600">Precio: L. {item.unitPrice.toFixed(2)}</Text>
          <Text className="text-sm font-[Poppins-SemiBold] mt-1">Subtotal: L. {item.total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          onPress={handleRemove}
          className="p-2 rounded-full bg-red-100 self-start"
        >
          <TrashIcon size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );
}, areEqual);

const EmptyCart: React.FC<{ onClose: () => void; onAddProducts: () => void }> = ({ onClose, onAddProducts }) => (
  <View className="flex-1 items-center justify-center pb-20 px-4">
    <View className="bg-gray-100 p-6 rounded-full mb-4">
      <CartIcon size={32} color="#999" />
    </View>
    <Text className="text-gray-500 text-lg font-medium mb-2 text-center">
      Tu carrito está vacío
    </Text>
    <Text className="text-gray-400 text-center mb-6">
      Añade productos para continuar con tu compra
    </Text>
    <TouchableOpacity
      onPress={() => {
        onClose();
        onAddProducts();
      }}
      className="px-6 py-3 bg-blue-500 rounded-lg"
      activeOpacity={0.7}
    >
      <Text className="text-white font-semibold">Explorar productos</Text>
    </TouchableOpacity>
  </View>
);

export default function PedidosScreen() {
  const router = useRouter();
  const products = useAppStore((s) => s.products);
  const updateQuantity = useAppStore((s) => s.updateQuantity);
  const removeProduct = useAppStore((s) => s.removeProduct);
  const customerSelected = useAppStore((s) => s.selectedCustomer);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const total = useMemo(() => {
    return products.reduce((sum, item) => sum + item.total, 0);
  }, [products]);

  const openCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetRef.current?.present();
  }, []);

  const closeCart = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) closeCart();
  }, [closeCart]);

  const handleUpdateQuantity = useCallback((itemCode: string, newQty: number) => {
    updateQuantity(itemCode, Math.max(1, newQty));
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((itemCode: string, itemName: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${itemName}" del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeProduct(itemCode);
          },
        },
      ]
    );
  }, [removeProduct]);

  const renderItem = useCallback(({ item }: { item: CartItemType }) => (
    <CartItem
      item={item}
      onUpdateQty={handleUpdateQuantity}
      onRemove={handleRemoveItem}
    />
  ), [handleUpdateQuantity, handleRemoveItem]);

  const renderFooter = useCallback((props: BottomSheetFooterProps) => (
    <BottomSheetFooter {...props} bottomInset={0}>
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <View className="flex-row justify-between items-center">
          <Text className='text-base text-gray-700 font-[Poppins-Medium]'>Cliente</Text>
          <Text className='font-[Poppins-Bold] text-black'>{customerSelected?.cardName}</Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-700 font-[Poppins-Medium]">Total</Text>
          <Text className="text-xl font-[Poppins-Bold] text-black">L. {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center h-[50px] bg-[#000] rounded-lg"
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            console.log('Realizar pedido', Date());
            closeCart();
          }}
        >
          <CartIcon color="white" />
          <Text className="text-white font-[Poppins-Regular] ml-2">Realizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetFooter>
  ), [total, closeCart]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>
      <View className="absolute bottom-8 right-8 gap-3 items-end z-10">
        {products.length > 0 && (
          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-[#09f] shadow-lg shadow-[#09f]/30"
            onPress={openCart}
          >
            <CartIcon color="white" />
            <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs font-bold">{products.length}</Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-[#09f] shadow-lg shadow-[#09f]/30"
          onPress={() => router.push('/client')}
        >
          <PlusIcon color="white" />
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        footerComponent={renderFooter}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.5}
            pressBehavior="close"
          />
        )}
      >
        <>
          <Text className="text-lg font-bold mb-4 px-4">Resumen del Pedido</Text>
          {products.length === 0 ? (
            <EmptyCart onClose={closeCart} onAddProducts={() => router.push('/client')} />
          ) : (
            <BottomSheetFlatList
              className="mb-[100px]"
              data={products}
              keyExtractor={(item) => item.itemCode}
              renderItem={renderItem}
              getItemLayout={(_, index) => ({ length: 150, offset: 150 * index, index })}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={10}
              contentContainerStyle={{ paddingBottom: 16 }}
              ListHeaderComponent={<View className="pt-2" />}
            />
          )}
        </>
      </BottomSheetModal>
    </View>
  );
}