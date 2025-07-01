import { Tabs } from 'expo-router';
import ProtectedLayout from '../ProtectedLayout';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import HomeIcon from '../../assets/icons/HomeIcon';
import UsersIcon from '../../assets/icons/UsersIcon';
import InvoicesIcon from '../../assets/icons/InvoicesIcon';
import SettingsIcon from '../../assets/icons/SettingsIcon';

export default function Layout() {
  const colorScheme = useColorScheme();
  return (
    <ProtectedLayout>
      <Tabs
        screenOptions={{
          // tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarActiveTintColor: "#09f", // Blue-800
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => <HomeIcon size={26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Clientes',
            tabBarIcon: ({ color }) => <UsersIcon size={26} color={color} />,
          }}
        />

        <Tabs.Screen
          name="invoices"
          options={{
            title: 'Facturas',
            tabBarIcon: ({ color }) => <InvoicesIcon size={26} color={color} />,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color }) => <SettingsIcon size={26} color={color} />,
          }}
        />
      </Tabs>
    </ProtectedLayout>
  );
}
