import { View, Text, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import PlusIcon from '@/assets/icons/PlusIcon'

interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
}

export default function PedidosScreen() {
  const router = useRouter();

  return (
    <View className='relative flex-1 bg-white' style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>

      <TouchableOpacity className='absolute bottom-8 right-8 rounded-full flex items-center justify-center h-[50px] w-[50px] bg-[#09f]' onPress={() => router.push('/aside')}>
        <PlusIcon color="white" />
      </TouchableOpacity>
    </View>
  );
}
