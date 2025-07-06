import React, { useEffect, useState } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import slugify from 'slugify';

const Tab = createMaterialTopTabNavigator();

import CategoryProductScreen from './category-product-list.tsx';
interface ProductData {
  itemCode: string;
  itemName: string;
  groupCode: number;
  groupName: string;
}

interface ProductCategory {
  groupCode: number;
  groupName: string;
  slug: string;
}

export default function TopTabNavigatorLayout() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
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

        const response = await axios.get<ProductData[]>('http://200.115.188.54:4325/sap/items/active', { headers });
        const allProducts = response.data;
        
        const uniqueCategories = new Map<number, string>();
        for (const product of allProducts) {
          if (product.groupCode && product.groupName) {
            uniqueCategories.set(product.groupCode, product.groupName);
          }
        }

        const formattedCategories: ProductCategory[] = Array.from(uniqueCategories.entries()).map(([code, name]) => ({
          groupCode: code,
          groupName: name,
          slug: slugify(name, { lower: true, strict: true }),
        }));

        formattedCategories.unshift({ groupCode: 0, groupName: 'Todas', slug: 'todas' });

        setCategories(formattedCategories);

      } catch (err: any) {
        console.error('Error al obtener categorías:', err);
        if (err.response) {
          setError(`Error del servidor: ${err.response.status} - ${err.response.data?.message || 'Mensaje desconocido'}`);
        } else if (err.request) {
          setError('No se pudo conectar al servidor. Verifica tu conexión.');
        } else {
          setError(`Ocurrió un error inesperado: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user?.token]);

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
        <Text style={styles.loadingText}>Cargando categorías...</Text>
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

  if (categories.length === 0) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.emptyText}>No se encontraron categorías de productos.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName={categories[0]?.slug || 'carrito'}
        screenOptions={{
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: 'gray',
          tabBarIndicatorStyle: {
            backgroundColor: '#000',
            height: 2
          },
          tabBarStyle: {
            backgroundColor: 'white',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            width: 230,
            fontWeight: 'bold',
          },
          tabBarPressColor: '#09f',
          tabBarScrollEnabled: true,
        }}
      >
        {categories.map((category) => (
          <Tab.Screen
            key={category.groupCode}
            name={category.slug}
            component={CategoryProductScreen}
            options={{
              title: category.groupName.charAt(0).toUpperCase() + category.groupName.slice(1).toLowerCase(),
            }}
            initialParams={{ groupName: category.groupName, groupCode: category.groupCode.toString() }}
          />
        ))}
      </Tab.Navigator>
    </View>
  );
}

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