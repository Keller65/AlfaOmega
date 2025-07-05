import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductDiscount } from '@/types/types'; // Asumiendo que este tipo incluye itemCode, itemName, unitPrice

type CartItem = ProductDiscount & {
  quantity: number;
  unitPrice: number;
  total: number;
};

interface CartStoreState {
  products: CartItem[];
  addProduct: (productToAdd: Omit<CartItem, 'total'>) => void; // Ahora actúa como "upsert"
  updateQuantity: (itemCode: string, quantity: number) => void;
  removeProduct: (itemCode: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      products: [],

      // Esta función ahora añadirá un producto o actualizará su cantidad si ya existe.
      // Si la cantidad es <= 0, eliminará el producto del carrito.
      addProduct: (productToAdd) => {
        const products = get().products;
        const existingIndex = products.findIndex(p => p.itemCode === productToAdd.itemCode);
        const updatedProducts = [...products];

        const newQuantity = productToAdd.quantity;
        const unitPrice = productToAdd.unitPrice;
        const newTotal = unitPrice * newQuantity;

        if (newQuantity <= 0) {
          // Si la cantidad es 0 o menos, eliminar el producto
          if (existingIndex > -1) {
            updatedProducts.splice(existingIndex, 1);
          }
        } else if (existingIndex > -1) {
          // Actualizar producto existente
          updatedProducts[existingIndex] = {
            ...products[existingIndex], // Mantener propiedades existentes
            ...productToAdd, // Sobreescribir con nuevas propiedades (como itemName, groupCode si cambian)
            quantity: newQuantity,
            total: newTotal,
          };
        } else {
          // Añadir nuevo producto
          updatedProducts.push({
            ...productToAdd,
            quantity: newQuantity,
            total: newTotal,
          });
        }

        set({ products: updatedProducts });
      },

      // Esta función actualizará la cantidad de un producto existente.
      // Si la cantidad es <= 0, eliminará el producto del carrito.
      updateQuantity: (itemCode, quantity) => {
        const products = get().products;
        const index = products.findIndex(p => p.itemCode === itemCode);
        if (index > -1) { // Verificar si el producto existe
          if (quantity <= 0) {
            // Si la cantidad es 0 o menos, eliminar el producto
            const updated = products.filter(p => p.itemCode !== itemCode);
            set({ products: updated });
          } else {
            // Actualizar la cantidad y el total del producto existente
            const product = products[index];
            const unitPrice = product.unitPrice;
            const total = unitPrice * quantity;

            const updatedProducts = [...products];
            updatedProducts[index] = {
              ...product,
              quantity,
              total,
            };
            set({ products: updatedProducts });
          }
        }
      },

      removeProduct: (itemCode) => {
        const updated = get().products.filter(p => p.itemCode !== itemCode);
        set({ products: updated });
      },

      clearCart: () => set({ products: [] }),
    }),
    {
      name: 'products', // clave de almacenamiento
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);