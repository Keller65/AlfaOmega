import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductDiscount } from '@/types/types';

// Define la interfaz para un item del carrito
type CartItem = ProductDiscount & {
  quantity: number;
  unitPrice: number;
  total: number;
};

// Define la interfaz para un cliente
interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
}

// Define la interfaz para el estado combinado de la aplicación
interface AppStoreState {
  // Estado del carrito
  products: CartItem[];
  addProduct: (productToAdd: Omit<CartItem, 'total'>) => void;
  updateQuantity: (itemCode: string, quantity: number) => void;
  removeProduct: (itemCode: string) => void;
  clearCart: () => void;

  // Estado del cliente seleccionado
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
  clearSelectedCustomer: () => void;

  // NUEVO: Caché de todos los productos
  allProductsCache: ProductDiscount[];
  setAllProductsCache: (products: ProductDiscount[]) => void;
  clearAllProductsCache: () => void; // Opcional: para limpiar la caché si es necesario
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      // --- Estado inicial ---
      products: [],
      selectedCustomer: null,
      allProductsCache: [], // Inicializa el caché de productos

      // --- Acciones del carrito ---
      addProduct: (productToAdd) => {
        const products = get().products;
        const existingIndex = products.findIndex(p => p.itemCode === productToAdd.itemCode);
        const updatedProducts = [...products];

        const newQuantity = productToAdd.quantity;
        const unitPrice = productToAdd.unitPrice;
        const newTotal = unitPrice * newQuantity;

        if (newQuantity <= 0) {
          if (existingIndex > -1) {
            updatedProducts.splice(existingIndex, 1);
          }
        } else if (existingIndex > -1) {
          updatedProducts[existingIndex] = {
            ...products[existingIndex],
            ...productToAdd,
            quantity: newQuantity,
            total: newTotal,
          };
        } else {
          updatedProducts.push({
            ...productToAdd,
            quantity: newQuantity,
            total: newTotal,
          });
        }

        set({ products: updatedProducts });
      },

      updateQuantity: (itemCode, quantity) => {
        const products = get().products;
        const index = products.findIndex(p => p.itemCode === itemCode);
        if (index > -1) {
          if (quantity <= 0) {
            const updated = products.filter(p => p.itemCode !== itemCode);
            set({ products: updated });
          } else {
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

      // --- Acciones del cliente seleccionado ---
      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
      clearSelectedCustomer: () => set({ selectedCustomer: null }),

      // NUEVO: Acciones para el caché de productos
      setAllProductsCache: (products) => set({ allProductsCache: products }),
      clearAllProductsCache: () => set({ allProductsCache: [] }),
    }),
    {
      name: 'app-store', // Un nombre único para el store persistente
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
