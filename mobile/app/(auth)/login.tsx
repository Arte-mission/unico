import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../utils/constants';
import { apiRequest } from '../../utils/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data) {
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error(e);
      // apiRequest handles generic alerts
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-center p-6" style={{ backgroundColor: '#0B0F1A' }}>
      <View className="flex items-center mb-10 mt-10">
        <Text className="text-4xl font-extrabold text-white tracking-tight">Unico.</Text>
        <Text className="text-gray-400 mt-3 text-center text-sm px-6 font-semibold">The network-of-networks where student builders prove execution through radical transparency.</Text>
      </View>

      <View>
        <TextInput 
          className="bg-secondary text-white px-4 py-3 rounded-xl border border-gray-700 mb-4" 
          placeholder="University Email" 
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput 
          className="bg-secondary text-white px-4 py-3 rounded-xl border border-gray-700 mb-6" 
          placeholder="Password" 
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity 
          className="bg-accent rounded-xl py-4 items-center shadow-sm"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Continue</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity className="mt-6 items-center" onPress={() => router.replace('/(tabs)')}>
          <Text className="text-gray-500 text-sm italic">Skip for now (Mock Mode)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
