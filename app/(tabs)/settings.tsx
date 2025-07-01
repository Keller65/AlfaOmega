import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/auth'

const Settings = () => {
  const { host, port, logout } = useAuth()
  const [hostInput, setHostInput] = useState(host)
  const [portInput, setPortInput] = useState(port)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load saved values on mount
    const loadData = async () => {
      const savedHost = await AsyncStorage.getItem('host')
      const savedPort = await AsyncStorage.getItem('port')
      if (savedHost) setHostInput(savedHost)
      if (savedPort) setPortInput(savedPort)
    }
    loadData()
  }, [])

  const saveHost = (value: string) => {
    setHostInput(value)
  }

  const savePort = (value: string) => {
    setPortInput(value)
  }

  const handleSave = async () => {
    setSaving(true)
    await AsyncStorage.setItem('host', hostInput ?? '')
    await AsyncStorage.setItem('port', portInput ?? '')
    setSaving(false)
    console.log('Host guardado:', host)
    console.log('Puerto guardado:', port)
  }


  return (
    <View className='mt-2' style={{ paddingTop: Constants.statusBarHeight, paddingHorizontal: 10 }}>
      <Text className="text-xl font-bold mb-4">Ajustes</Text>

      <View className="mb-3">
        <Text className="text-base mb-2">Aplicación</Text>
        <View className="bg-white rounded shadow p-3 mb-2">
          <Text>Eliminar caché</Text>
        </View>
        <View className="bg-white rounded shadow p-3 mb-2">
          <Text>Notificaciones</Text>
        </View>
        <View className="bg-white rounded shadow p-3 mb-2">
          <Text className="mb-1">Host</Text>
          <TextInput
            className="border rounded px-2 py-1 mb-2"
            placeholder="Ingrese el host"
            value={host ?? ''}
            onChangeText={saveHost}
            autoCapitalize="none"
          />
          <Text className="mb-1">Puerto</Text>
          <TextInput
            className="border rounded px-2 py-1"
            placeholder="Ingrese el puerto"
            value={port ?? ''}
            onChangeText={savePort}
            keyboardType="numeric"
          />
          <TouchableOpacity
            className="bg-blue-500 rounded mt-3 py-2"
            onPress={handleSave}
            disabled={saving}
          >
            <Text className="text-white text-center font-bold">
              {saving ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity className='w-full p-2' onPress={logout}>
        <Text className='text-red-500 text-center'>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Settings;