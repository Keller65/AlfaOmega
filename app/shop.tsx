import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, ActivityIndicator, Text, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import slugify from 'slugify';
import { useAuth } from '@/context/auth';
import { useRoute } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();
import CategoryProductScreen from './(top-tabs)/category-product-list';

interface ProductCategory {
  code: string;
  name: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientPriceList, setClientPriceList] = useState<string | undefined>(undefined);

  const route = useRoute();
  const { cardCode, cardName, federalTaxID, priceListNum } = route.params as {
    cardCode?: string;
    cardName?: string;
    federalTaxID?: string;
    priceListNum?: string;
  };

  // --- All Hooks must be declared here, unconditionally ---

  useEffect(() => {
    const storeAndLoadClientData = async () => {
      let currentCardCode = cardCode;
      let currentCardName = cardName;
      let currentFederalTaxID = federalTaxID;
      let currentPriceListNum = priceListNum;

      if (cardCode && cardName && federalTaxID && priceListNum) {
        try {
          await AsyncStorage.setItem(
            'selectedClient',
            JSON.stringify({ cardCode, cardName, federalTaxID, priceListNum })
          );
          console.log('Cliente guardado en AsyncStorage', cardName);
          setClientPriceList(priceListNum);
        } catch (err) {
          console.error('Error al guardar cliente en AsyncStorage:', err);
        }
      } else {
        try {
          const cachedClientData = await AsyncStorage.getItem('selectedClient');
          if (cachedClientData) {
            const parsedClient: SelectedClient = JSON.parse(cachedClientData);
            currentCardCode = parsedClient.cardCode;
            currentCardName = parsedClient.cardName;
            currentFederalTaxID = parsedClient.federalTaxID;
            currentPriceListNum = parsedClient.priceListNum;
            setClientPriceList(parsedClient.priceListNum);
            console.log('Cliente cargado de AsyncStorage', parsedClient.cardName);
          }
        } catch (err) {
          console.error('Error al cargar cliente de AsyncStorage:', err);
        }
      }

      if (!clientPriceList && currentCardCode) {
        if (currentPriceListNum) {
          setClientPriceList(currentPriceListNum);
        } else {
          setClientPriceList('1');
        }
      }
    };

    storeAndLoadClientData();
  }, [cardCode, cardName, federalTaxID, priceListNum, clientPriceList]); // Added clientPriceList to dependency array

  const headers = useMemo(() => ({
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
  }), [user?.token]);

  const fetchCategories = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      setError('No se ha iniciado sesión o el token no está disponible.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cached = await AsyncStorage.getItem('cachedCategories');
      if (cached) {
        setCategories(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const response = await axios.get<Array<{ code: string, name: string }>>(
        'http://200.115.188.54:4325/sap/items/categories',
        { headers }
      );

      const formattedCategories: ProductCategory[] = response.data.map(category => ({
        code: category.code,
        name: category.name,
        slug: slugify(category.name, { lower: true, strict: true }),
      }));

      formattedCategories.unshift({
        code: '0000',
        name: 'Todas',
        slug: 'todas'
      });

      await AsyncStorage.setItem('cachedCategories', JSON.stringify(formattedCategories));
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
  }, [headers, user?.token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // The useMemo for tabScreens also needs to be unconditional
  const tabScreens = useMemo(() => (
    categories.map((category) => (
      <Tab.Screen
        key={category.code}
        name={category.slug}
        component={CategoryProductScreen}
        options={{
          title: category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase(),
        }}
        initialParams={{
          groupName: category.name,
          groupCode: category.code,
          priceListNum: priceListNum,
        }}
      />
    ))
  ), [categories, clientPriceList]);

  // --- Conditional Renders (Return statements) go AFTER all hooks ---

  if (!user?.token) {
    return (
      <View style={styles.fullScreenCenter}>
        <Text style={styles.errorText}>No has iniciado sesión o tu sesión ha expirado.</Text>
      </View>
    );
  }

  if (loading || clientPriceList === undefined) { // Combine loading states
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
            width: 230,
            fontWeight: 'bold',
          },
          tabBarPressColor: 'transparent',
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