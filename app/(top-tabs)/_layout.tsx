import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import slugify from 'slugify';
import { useAuth } from '../../context/auth';
import CategoryProductScreen from './category-product-list';

const Tab = createMaterialTopTabNavigator();

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

interface SelectedClient {
  cardCode: string;
  cardName: string;
  federalTaxID?: string;
  priceListNum?: string;
}

export default function TopTabNavigatorLayout() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientPriceList, setClientPriceList] = useState<string | undefined>(undefined);
  const [loadingClientData, setLoadingClientData] = useState(true);
  const FETCH_URL = process.env.EXPO_PUBLIC_API_URL + "/sap/items/categories";

  const route = useRoute();
  const { priceListNum: routePriceListNum } = route.params as { priceListNum?: string };

  useEffect(() => {
    const loadClientPriceList = async () => {
      setLoadingClientData(true);
      let currentPriceList: string | undefined;

      if (routePriceListNum) {
        currentPriceList = routePriceListNum;
      } else {
        try {
          const cachedClientData = await AsyncStorage.getItem('selectedClient');
          if (cachedClientData) {
            const parsedClient: SelectedClient = JSON.parse(cachedClientData);
            currentPriceList = parsedClient.priceListNum;
          }
        } catch (err) {
          console.error('Error al cargar cliente de AsyncStorage para priceListNum:', err);
        }
      }

      if (!currentPriceList) {
        currentPriceList = '1';
      }
      setClientPriceList(currentPriceList);
      setLoadingClientData(false);
    };

    loadClientPriceList();
  }, [routePriceListNum]);

  const headers = useMemo(() => ({
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
  }), [user?.token]);

  const fetchCategories = useCallback(async () => {
    if (!user?.token) {
      setLoadingCategories(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }

    setLoadingCategories(true);
    setError(null);

    try {
      const response = await axios.get<ProductData[]>(FETCH_URL, { headers });

      const uniqueCategories = new Map<number, string>();
      response.data.forEach((cat: any) => {
        uniqueCategories.set(cat.code, cat.name);
      });

      const formattedCategories: ProductCategory[] = Array.from(uniqueCategories.entries()).map(([code, name]) => ({
        groupCode: code,
        groupName: name,
        slug: slugify(name, { lower: true, strict: true }),
      }));

      formattedCategories.unshift({ groupCode: 0, groupName: '0000', slug: 'todas' });
      setCategories(formattedCategories);

    } catch (err: any) {
      console.error('Error al obtener categorías:', err);
      if (axios.isAxiosError(err)) {
        setError(`Error del servidor: ${err.response?.status} - ${err.response?.data?.message || 'Mensaje desconocido'}`);
      } else if (err.request) {
        setError('No se pudo conectar al servidor. Verifica tu conexión.');
      } else {
        setError(`Ocurrió un error inesperado: ${err.message}`);
      }
    } finally {
      setLoadingCategories(false);
    }
  }, [headers, user?.token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const isLoading = loadingClientData || loadingCategories || clientPriceList === undefined;

  const tabScreens = useMemo(() => (
    categories.map((category) => (
      <Tab.Screen
        key={category.groupCode}
        name={category.slug}
        component={CategoryProductScreen}
        options={{
          title: category.groupName.charAt(0).toUpperCase() + category.groupName.slice(1).toLowerCase(),
        }}
        initialParams={{
          groupName: category.groupName,
          groupCode: category.groupCode.toString(),
          priceListNum: clientPriceList,
        }}
      />
    ))
  ), [categories, clientPriceList]);

  if (!user?.token) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.errorText}>No has iniciado sesión o tu sesión ha expirado.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.fullScreenCenter}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando datos del cliente y categorías...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.subText}>Por favor, intenta de nuevo más tarde.</Text>
        <Button title="Reintentar" onPress={fetchCategories} />
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
        initialRouteName={categories[0]?.slug || 'todas'}
        screenOptions={{
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: 'gray',
          tabBarIndicatorStyle: {
            backgroundColor: '#000',
            height: 2
          },
          tabBarStyle: {
            backgroundColor: 'white',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
          },
          tabBarPressColor: 'rgba(0,0,0,0.1)',
          tabBarScrollEnabled: true,
        }}
      >
        {tabScreens}
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
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
});