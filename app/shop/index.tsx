// app/shop/index.tsx
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAppStore } from '@/state/index'; // Asegúrate de que esta ruta sea correcta

export default function ShopIndexScreen() {
  const selectedCustomer = useAppStore(state => state.selectedCustomer);

  // Puedes redirigir a la primera pestaña de tu navegador de pestañas.
  // Aquí asumo que tienes una categoría con slug 'todas' o la primera que se cargue.
  // O simplemente puedes dejarlo sin redirección si el _layout ya maneja el estado inicial.

  // Si quieres que al llegar a /shop directamente, cargue la primera pestaña, puedes hacer esto:
  useEffect(() => {
    if (selectedCustomer) {
      // Si necesitas cargar las categorías para saber cuál es la primera,
      // la lógica de carga de categorías ya está en app/shop/_layout.tsx.
      // Por simplicidad, puedes redirigir a una ruta por defecto o dejar que el _layout maneje el renderizado.
    }
  }, [selectedCustomer]);

  // En este caso, como el _layout.tsx ya es el Tab.Navigator,
  // simplemente retornar null o un componente vacío hará que el _layout se renderice por encima.
  // Expo Router se encargará de mostrar el _layout (tu Tab.Navigator) para la ruta /shop.
  return null;
}