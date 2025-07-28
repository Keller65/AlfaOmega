import { withPlugins } from '@expo/config-plugins';

const config = {
  expo: {
    name: 'Alfa & Omega',
    slug: 'alfa-and-omega',
    version: '1.0.0',
    sdkVersion: '52.0.20',
    userInterfaceStyle: 'automatic',
    android: {
      package: 'com.aerley_adkins.alfaandomega',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
          },
          kotlinVersion: '1.8.0',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '2b76a3bb-99fb-4601-8265-be0f86eaec71',
      },
    },
  },
};

export default config;
