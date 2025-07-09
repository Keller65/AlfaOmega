import { useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import PlusIcon from '@/assets/icons/PlusIcon';
import CartIcon from '@/assets/icons/CartIcon';
import MinusIcon from '@/assets/icons/MinusIcon';
import { useAppStore } from '@/state/index';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFooter, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import TrashIcon from '@/assets/icons/TrashIcon';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, FadeIn, FadeOut, Layout, ZoomIn, ZoomOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const CartItem = memo(({ item, onUpdateQty, onRemove }: {
  item: any,
  onUpdateQty: (code: string, qty: number) => void,
  onRemove: (code: string, name: string) => void
}) => {
  const scaleValue = useSharedValue(1);
  const xOffset = useSharedValue(0);
  const opacityValue = useSharedValue(1);
  const removeRequested = useRef(false);

  const transformStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }, { translateX: xOffset.value }]
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value
  }));

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1);
  };

  const handleChange = (type: 'add' | 'sub') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQty = type === 'add' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
    onUpdateQty(item.itemCode, newQty);

    xOffset.value = withSequence(
      withTiming(type === 'add' ? 5 : -5, { duration: 50 }),
      withSpring(0, { damping: 10, stiffness: 200 })
    );
  };

  const handleRemove = () => {
    if (removeRequested.current) return;
    removeRequested.current = true;

    onRemove(item.itemCode, item.itemName);

    opacityValue.value = withTiming(0, { duration: 200 });
    xOffset.value = withTiming(200, { duration: 200 });
  };

  return (
    <Animated.View
      layout={Layout.springify().damping(15)}
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(200)}
      className="mb-3 border-b pb-3 border-gray-200 px-4"
    >
      <Animated.View style={[opacityStyle]}>
        <Animated.View style={[transformStyle]} className="flex-row gap-4 items-center">
          <Animated.View
            entering={FadeIn.delay(100)}
            className="size-[100px] bg-gray-200 rounded-lg items-center justify-center"
          >
            <Text className="text-gray-400">Imagen</Text>
          </Animated.View>

          <View className="flex-1">
            <Text className="font-[Poppins-SemiBold] tracking-[-0.3px]" numberOfLines={2}>{item.itemName.toLowerCase()}</Text>

            <View className="flex-row items-center my-2 gap-2">
              <AnimatedTouchable
                onPress={() => handleChange('sub')}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                className="bg-gray-200 p-2 rounded-full"
                disabled={item.quantity <= 1}
                accessibilityLabel={`Reducir cantidad de ${item.itemName}`}
              >
                <MinusIcon size={16} color={item.quantity <= 1 ? "#ccc" : "#000"} />
              </AnimatedTouchable>

              <AnimatedTextInput
                className="border border-gray-300 rounded-md px-2 py-1 text-center w-[50px] text-black"
                keyboardType="numeric"
                value={String(item.quantity)}
                onChangeText={(text) => {
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num)) onUpdateQty(item.itemCode, Math.max(1, num));
                }}
                maxLength={3}
                entering={ZoomIn.delay(150)}
              />

              <AnimatedTouchable
                onPress={() => handleChange('add')}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                className="bg-gray-200 p-2 rounded-full"
                accessibilityLabel={`Aumentar cantidad de ${item.itemName}`}
              >
                <PlusIcon size={16} />
              </AnimatedTouchable>
            </View>

            <Text className="text-sm font-[Poppins-Regular] text-gray-600">Precio: L. {item.unitPrice.toFixed(2)}</Text>
            <Text className="text-sm font-[Poppins-SemiBold] mt-1">Subtotal: L. {item.total.toFixed(2)}</Text>
          </View>

          <AnimatedTouchable
            onPress={handleRemove}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className="p-2 rounded-full bg-red-100 self-start"
            accessibilityLabel={`Eliminar ${item.itemName} del carrito`}
            entering={ZoomIn.delay(200)}
          >
            <TrashIcon size={20} color="red" />
          </AnimatedTouchable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

const EmptyCart = ({ onClose, onAddProducts }: {
  onClose: () => void,
  onAddProducts: () => void
}) => (
  <Animated.View
    entering={FadeIn.duration(500)}
    className="flex-1 items-center justify-center pb-20 px-4"
  >
    <Animated.View
      entering={ZoomIn.duration(600)}
      className="bg-gray-100 p-6 rounded-full mb-4"
    >
      <CartIcon size={32} color="#999" />
    </Animated.View>
    <Animated.Text
      entering={FadeIn.delay(200)}
      className="text-gray-500 text-lg font-medium mb-2 text-center"
    >
      Tu carrito está vacío
    </Animated.Text>
    <Animated.Text
      entering={FadeIn.delay(300)}
      className="text-gray-400 text-center mb-6"
    >
      Añade productos para continuar con tu compra
    </Animated.Text>
    <AnimatedTouchable
      entering={FadeIn.delay(400)}
      onPress={() => {
        onClose();
        onAddProducts();
      }}
      className="px-6 py-3 bg-blue-500 rounded-lg"
      activeOpacity={0.7}
    >
      <Text className="text-white font-semibold">Explorar productos</Text>
    </AnimatedTouchable>
  </Animated.View>
);

export default function PedidosScreen() {
  const router = useRouter();
  const products = useAppStore((state) => state.products);
  const updateQuantity = useAppStore((state) => state.updateQuantity);
  const removeProduct = useAppStore((state) => state.removeProduct);

  const cartScale = useSharedValue(1);
  const badgeScale = useSharedValue(0);

  const total = useMemo(() => {
    return products.reduce((sum, item) => sum + item.total, 0);
  }, [products]);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['60%', '85%'], []);

  const openCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cartScale.value = withSequence(
      withSpring(1.1),
      withSpring(1)
    );
    bottomSheetRef.current?.present();
  };

  const closeCart = () => {
    bottomSheetRef.current?.dismiss();
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) closeCart();
  }, []);

  const renderBottomSheetFooter = useCallback(
    (props: any) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View
          className="bg-white border-t border-gray-200 px-4 py-4"
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base text-gray-700 font-[Poppins-Medium]">Total</Text>
            <Text
              className="text-xl font-[Poppins-Bold] text-black "
            >
              L. {total.toFixed(2)}
            </Text>
          </View>

          <AnimatedTouchable
            className="flex-row items-center justify-center h-[50px] bg-[#000] rounded-lg"
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              console.log('Realizar pedido', Date());
              closeCart();
            }}
            accessibilityLabel="Realizar pedido"
          >
            <CartIcon color="white" />
            <Text className="text-white font-[Poppins-Regular] ml-2 tracking-[-0.3px]">Realizar Pedido</Text>
          </AnimatedTouchable>
        </View>
      </BottomSheetFooter>
    ),
    [total]
  );

  const handleUpdateQuantity = useCallback((itemCode: string, newQty: number) => {
    updateQuantity(itemCode, Math.max(1, newQty));
    badgeScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
  }, [updateQuantity]);

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

  const renderItem = useCallback(({ item }: { item: any }) => (
    <CartItem
      item={item}
      onUpdateQty={handleUpdateQuantity}
      onRemove={handleRemoveItem}
    />
  ), [handleUpdateQuantity, handleRemoveItem]);

  const cartButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }]
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }]
  }));

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}
    >
      <View className="absolute bottom-8 right-8 gap-3 items-end z-10">
        {products.length > 0 && (
          <AnimatedTouchable
            style={[cartButtonStyle]}
            className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-[#09f] shadow-lg shadow-[#09f]/30"
            onPress={openCart}
            activeOpacity={0.7}
            accessibilityLabel="Ver carrito"
          >
            <CartIcon color="white" />
            <Animated.View
              style={[badgeStyle]}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
              entering={ZoomIn}
              exiting={ZoomOut}
            >
              <Text className="text-white text-xs font-bold">{products.length}</Text>
            </Animated.View>
          </AnimatedTouchable>
        )}
        <AnimatedTouchable
          entering={FadeIn.delay(500)}
          className="rounded-full flex items-center justify-center h-[50px] w-[50px] bg-[#09f] shadow-lg shadow-[#09f]/30"
          onPress={() => router.push('/client')}
          activeOpacity={0.7}
          accessibilityLabel="Añadir productos"
        >
          <PlusIcon color="white" />
        </AnimatedTouchable>
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
          <Animated.Text
            entering={FadeIn}
            className="text-lg font-bold mb-4 px-4"
          >
            Resumen del Pedido
          </Animated.Text>

          {products.length === 0 ? (
            <EmptyCart
              onClose={closeCart}
              onAddProducts={() => router.push('/client')}
            />
          ) : (
            <BottomSheetFlatList
              className="mb-[100px]"
              data={products}
              keyExtractor={(item) => item.itemCode}
              renderItem={renderItem}
              getItemLayout={(data, index) => (
                { length: 150, offset: 150 * index, index }
              )}
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