import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import PlusIcon from '@/assets/icons/PlusIcon';
import CartIcon from '@/assets/icons/CartIcon';
import MinusIcon from '@/assets/icons/MinusIcon';
import { useCartStore } from '@/state/index';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFooter, BottomSheetFlatList, } from '@gorhom/bottom-sheet';
import { useRef, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import TrashIcon from '@/assets/icons/TrashIcon';

export default function PedidosScreen() {
  const router = useRouter();
  const products = useCartStore((state) => state.products);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);

  const total = useMemo(() => {
    return products.reduce((sum, item) => sum + item.total, 0);
  }, [products]);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['60%', '85%'], []);
  const openCart = () => bottomSheetRef.current?.present();
  const closeCart = () => bottomSheetRef.current?.dismiss();

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) closeCart();
  }, []);

  const renderBottomSheetFooter = useCallback(
    (props: any) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base text-gray-700 font-[Poppins-Medium]">Total</Text>
            <Text className="text-xl font-[Poppins-Bold] text-black">L. {total.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center h-[50px] bg-[#000] rounded-lg"
            onPress={() => {
              console.log('Realizar pedido');
              closeCart();
            }}
          >
            <CartIcon color="white" />
            <Text className="text-white font-[Poppins-Regular] ml-2">Realizar Pedido</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ),
    [total]
  );

  const handleChangeQty = (itemCode: string, type: 'add' | 'sub', currentQty: number) => {
    const newQty = type === 'add' ? currentQty + 1 : currentQty - 1;
    updateQuantity(itemCode, newQty);
  };

  const handleRemoveItem = useCallback((itemCode: string, itemName: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${itemName}" del carrito?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
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


  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}
    >
      <View className="absolute bottom-8 right-8 gap-3 items-end z-10">
        {products.length > 0 && (
          <TouchableOpacity
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-[#09f]"
            onPress={openCart}
          >
            <CartIcon color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-[#09f]"
          onPress={() => router.push('/aside')}
        >
          <PlusIcon color="white" />
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        footerComponent={renderBottomSheetFooter}
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
        <>
          <Text className="text-lg font-bold mb-4" style={{ paddingHorizontal: 16 }}>Resumen del Pedido</Text>

          {products.length === 0 ? (
            <View className="flex-1 items-center justify-center pb-20">
              <Text className="text-gray-500 text-base">El carrito está vacío.</Text>
              <TouchableOpacity
                onPress={() => {
                  closeCart();
                  router.push('/aside'); // O a la pantalla principal de productos
                }}
                className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
              >
                <Text className="text-white font-semibold">Añadir productos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <BottomSheetFlatList
              className="mb-[100px]" // Ajusta este margen si es necesario para el footer
              data={products}
              keyExtractor={(item) => item.itemCode}
              renderItem={({ item }) => (
                <View
                  className="mb-3 border-b pb-3 border-gray-200 flex-row gap-4 items-center"
                  style={{ paddingHorizontal: 16 }}
                >
                  <View className="size-[100px] bg-gray-300 rounded-lg" />
                  <View className="flex-1">
                    <Text className="font-semibold">{item.itemName}</Text>
                    <View className="flex-row items-center my-2 gap-2">
                      <TouchableOpacity
                        onPress={() => handleChangeQty(item.itemCode, 'sub', item.quantity)}
                        className="bg-gray-300 p-1 rounded-full"
                      >
                        <MinusIcon size={18} />
                      </TouchableOpacity>

                      <TextInput
                        className="border border-gray-300 rounded-md px-2 py-1 text-center w-[50px] text-black"
                        keyboardType="numeric"
                        value={String(item.quantity)} // Asegurarse de que sea una cadena explícitamente
                        onChangeText={(text) => {
                          const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                          // Permitir 0 aquí para que el store lo elimine
                          if (!isNaN(num)) {
                            updateQuantity(item.itemCode, num);
                          }
                        }}
                      />

                      <TouchableOpacity
                        onPress={() => handleChangeQty(item.itemCode, 'add', item.quantity)}
                        className="bg-gray-300 p-1 rounded-full"
                      >
                        <PlusIcon size={18} />
                      </TouchableOpacity>
                    </View>
                    {/* Asegurarse de que los precios sean cadenas explícitamente */}
                    <Text className="text-sm text-gray-600">Precio: L. {item.unitPrice.toFixed(2)}</Text>
                    <Text className="text-sm font-bold">Subtotal: L. {item.total.toFixed(2)}</Text>
                  </View>
                  {/* Botón de eliminar */}
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.itemCode, item.itemName)}
                    className="p-2 rounded-full bg-red-100 self-start" // self-start para alinearse arriba
                  >
                    <TrashIcon size={20} color="red" />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )}
        </>
      </BottomSheetModal>
    </View>
  );
}