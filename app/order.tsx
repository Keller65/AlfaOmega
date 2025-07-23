import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';


const OrderDetails = () => {
  const route = useRoute();
  const { OrderDetails } = route.params as { OrderDetails: any };

  console.log(JSON.stringify(OrderDetails))

  return (
    <View className='flex-1 bg-white'>
      <Text>Order Details</Text>
    </View>
  )
}

export default OrderDetails