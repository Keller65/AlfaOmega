import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import TopTabNavigatorLayout from '../(top-tabs)/_layout';

const PedidoScreen: React.FC = () => {
  const route = useRoute();
  const { cardCode, cardName, federalTaxID } = route.params as {
    cardCode?: string;
    cardName?: string;
    federalTaxID?: string;
  };

  return (
    <View className='flex-1 bg-white'>
      <TopTabNavigatorLayout />
    </View>
  );
};

export default PedidoScreen;