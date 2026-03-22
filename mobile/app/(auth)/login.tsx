import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Basic mock navigation to tabs
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-center p-6">
      <View className="flex items-center mb-10 mt-10">
        <Text className="text-4xl font-extrabold text-textPrimary tracking-tight">Unico.</Text>
        <Text className="text-gray-400 mt-3 text-center text-sm px-6 font-semibold">The network-of-networks where student builders prove execution through radical transparency.</Text>
      </View>

      <View className="space-y-4">
        <TextInput 
          className="bg-secondary text-textPrimary px-4 py-3 rounded-xl border border-gray-700" 
          placeholder="University Email" 
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#9ca3af"
        />
        <TextInput 
          className="bg-secondary text-textPrimary px-4 py-3 rounded-xl border border-gray-700" 
          placeholder="Password" 
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity 
          className="bg-accent rounded-xl py-4 items-center mt-6 shadow-sm"
          onPress={handleLogin}
        >
          <Text className="text-white font-semibold text-lg">Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
