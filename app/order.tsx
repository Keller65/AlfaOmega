import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import Constants from 'expo-constants';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useAuth } from '@/context/auth'; // <-- aquí importas useAuth

import { OrderDataType } from '@/types/types';

const OrderDetails = () => {
  const route = useRoute();
  const { OrderDetails } = route.params as { OrderDetails: string };
  const [orderData, setOrderData] = useState<OrderDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { user } = useAuth(); // obtenemos el usuario/vendedor

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(
          `http://200.115.188.54:4325/sap/quotations/${OrderDetails}`
        );
        setOrderData(response.data);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (OrderDetails) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [OrderDetails]);

  const totalItems = useMemo(() => {
    return orderData?.lines.reduce((sum, line) => sum + line.quantity, 0) || 0;
  }, [orderData]);

  const handleShareAsPdf = useCallback(async () => {
    if (!orderData) {
      Alert.alert('Error', 'No hay datos del pedido para generar el PDF.');
      return;
    }

    setIsGeneratingPdf(true);

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * {
              font-family: 'Poppins-Regular', sans-serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              padding: 24px;
              background: #fff;
              color: #111;
            }
            h1 {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 16px;
            }
            .info p {
              margin-bottom: 4px;
              font-size: 14px;
            }
            table {
              width: 100%;
              margin-top: 24px;
              border-collapse: collapse;
              font-size: 14px;
            }
            th {
              text-align: left;
              padding: 8px;
              background-color: #f3f3f3;
            }
            td {
              padding: 8px;
              border-top: 1px solid #eee;
            }
            .total {
              text-align: right;
              font-weight: bold;
              margin-top: 16px;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <h1>Resumen del Pedido</h1>
          <div class="info">
            <p><strong>Cliente:</strong> ${orderData.cardName}</p>
            <p><strong>RTN:</strong> ${orderData.federalTaxID ?? 'N/A'}</p>
            <p><strong>Fecha:</strong> ${new Date(orderData.docDate).toLocaleDateString()}</p>
            <p><strong>Pedido #:</strong> ${orderData.docEntry}</p>
            <p><strong>Vendedor:</strong> ${user?.fullName ?? 'N/A'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderData.lines
                .map(
                  (item) => `
                  <tr>
                    <td>${item.itemDescription}</td>
                    <td>${item.quantity}</td>
                    <td>L. ${item.priceAfterVAT.toFixed(2)}</td>
                    <td>L. ${item.lineTotal.toFixed(2)}</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
          <div class="total">
            Total: L. ${orderData.docTotal.toFixed(2)}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: 'Compartir Pedido',
        });
      } else {
        Alert.alert('Compartir no disponible', 'Tu dispositivo no permite compartir archivos.');
      }
    } catch (error) {
      console.error('Error al generar o compartir el PDF:', error);
      Alert.alert('Error', 'No se pudo generar o compartir el PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [orderData, user]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Cargando detalles del pedido...</Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>No se encontraron detalles para este pedido.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ marginTop: -Constants.statusBarHeight }}>
      <ScrollView className="flex-1 p-4 bg-gray-50">
        <View className="p-5 bg-white rounded-lg shadow-sm">
          <View className="flex-row justify-between items-center mb-5">
            <View className="flex-row items-center">
              <FontAwesome name="user-circle-o" size={24} color="#000" />
              <Text className="ml-2 text-lg font-[Poppins-SemiBold] tracking-[-0.3px]">
                {orderData.cardName}
              </Text>
            </View>
          </View>

          {/* Mostrar RTN del cliente */}
          <View className="mb-5">
            <Text className="text-sm text-gray-600 font-[Poppins-Regular]">
              RTN: {orderData.federalTaxID ?? 'No disponible'}
            </Text>
          </View>

          {/* Mostrar nombre del vendedor */}
          <View className="mb-5">
            <Text className="text-sm text-gray-600 font-[Poppins-Regular]">
              Vendedor: {user?.fullName ?? 'No disponible'}
            </Text>
          </View>

          <View className="flex-row justify-between mb-5">
            <View className="flex-1 p-3 bg-gray-50 rounded-lg mr-2">
              <Text className="text-xs text-gray-500">Estado</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="checkmark-circle" size={18} color="green" />
                <Text className="ml-1 text-sm font-[Poppins-SemiBold] text-green-600">
                  Completado
                </Text>
              </View>
            </View>
            <View className="flex-1 p-3 bg-gray-50 rounded-lg ml-2">
              <Text className="text-xs text-gray-500 font-[Poppins-Regular]">Fecha</Text>
              <Text className="text-sm font-[Poppins-SemiBold] mt-1">
                {new Date(orderData.docDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-5">
            <View className="flex-1 p-3 bg-gray-50 rounded-lg mr-2">
              <Text className="text-xs text-gray-500 font-[Poppins-Regular]">
                Total del Pedido
              </Text>
              <Text className="text-xl text-gray-900 mt-1 font-[Poppins-SemiBold]">
                L. {orderData.docTotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-1 p-3 bg-gray-50 rounded-lg ml-2">
              <Text className="text-xs text-gray-500 font-[Poppins-Regular]">Items</Text>
              <Text className="text-xl font-[Poppins-SemiBold] text-gray-900 mt-1">
                {totalItems}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-full bg-black h-[50px] rounded-full flex-row gap-3 p-2 items-center justify-center"
            onPress={handleShareAsPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <ActivityIndicator color="white" />
                <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px]">
                  Generando PDF
                </Text>
              </>
            ) : (
              <>
                <Entypo name="share" size={24} color="white" />
                <Text className="text-white font-[Poppins-SemiBold] tracking-[-0.3px]">
                  Compartir como PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-5">
          <Text className="text-xl mb-4 font-[Poppins-SemiBold]">Productos</Text>
          {orderData.lines.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center bg-white p-3 rounded-lg mb-3 shadow-sm"
            >
              <View className="bg-gray-200 p-2 rounded-full mr-3">
                <Ionicons name="bag-handle-outline" size={24} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold font-[Poppins-Regular] tracking-[-0.3px]">
                  {item.itemDescription}
                </Text>
                <Text className="text-sm text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">
                  Cantidad: {item.quantity}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-bold font-[Poppins-Regular] tracking-[-0.3px]">
                  L. {item.lineTotal.toFixed(2)}
                </Text>
                <Text className="text-xs text-gray-500 font-[Poppins-Regular] tracking-[-0.3px]">
                  Precio Unitario: L. {item.priceAfterVAT.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderDetails;
