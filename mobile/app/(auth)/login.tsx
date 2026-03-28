import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiRequest } from '../../utils/api';

export default function AuthScreen() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter email and password');
      return;
    }

    if (!isLogin && !name) {
      Alert.alert('Required Fields', 'Please enter your full name for registration');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login Logic
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        if (data && data.token) {
          router.replace('/(tabs)');
        } else if (data) {
          // Fallback if the token exists implicitly
          router.replace('/(tabs)');
        }
      } else {
        // Registration Logic
        const data = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ 
            name, 
            email, 
            password, 
            university: university.trim() ? university : 'Default University' 
          })
        });
        if (data) {
          Alert.alert('Success', 'Welcome to Unico! Please login to continue.', [
            { text: 'OK', onPress: () => setIsLogin(true) }
          ]);
        }
      }
    } catch (e: any) {
      console.error('Auth request failed:', e.message);
      // apiRequest handles generic UI alerts natively so let it do its job
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0E17]" style={{ backgroundColor: '#0A0E17' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-6"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View className="items-center mb-10">
            <View className="bg-[#6366F1]/20 p-4 rounded-3xl mb-4 border border-[#6366F1]/30">
              <Text className="text-4xl font-black text-white tracking-tighter" style={{ textShadowColor: '#6366F1', textShadowRadius: 10 }}>UNICO.</Text>
            </View>
            <Text className="text-gray-400 mt-2 text-center text-sm px-4 leading-relaxed font-medium">
              The network-of-networks where student builders prove execution through radical transparency.
            </Text>
          </View>

          {/* Form Container */}
          <View className="bg-[#111726]/80 p-6 rounded-3xl border border-white/5 shadow-2xl">
            
            <View className="flex-row mb-8 rounded-xl bg-[#0F1420] p-1 border border-white/5">
              <TouchableOpacity 
                onPress={() => setIsLogin(true)}
                className={`flex-1 flex-row justify-center py-3 rounded-lg transition-all ${isLogin ? 'bg-[#2A344A] shadow-md' : 'bg-transparent'}`}
                activeOpacity={0.8}
              >
                <Text className={`font-semibold text-center ${isLogin ? 'text-white' : 'text-gray-500'}`}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setIsLogin(false)}
                className={`flex-1 flex-row justify-center py-3 rounded-lg transition-all ${!isLogin ? 'bg-[#2A344A] shadow-md' : 'bg-transparent'}`}
                activeOpacity={0.8}
              >
                <Text className={`font-semibold text-center ${!isLogin ? 'text-white' : 'text-gray-500'}`}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Registration specific fields */}
            {!isLogin && (
              <>
                <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 mb-2">Full Name</Text>
                <TextInput 
                  className="bg-[#1A2235] text-white px-5 py-4 rounded-xl border border-white/5 mb-4 font-medium" 
                  placeholder="e.g. Alex Student" 
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#4B5563"
                  autoCapitalize="words"
                />

                <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 mb-2">University / Organization</Text>
                <TextInput 
                  className="bg-[#1A2235] text-white px-5 py-4 rounded-xl border border-white/5 mb-4 font-medium" 
                  placeholder="e.g. UNSW or Stanford" 
                  value={university}
                  onChangeText={setUniversity}
                  placeholderTextColor="#4B5563"
                  autoCapitalize="words"
                />
              </>
            )}

            {/* Standard Login/Reg fields */}
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 mb-2">Email Address</Text>
            <TextInput 
              className="bg-[#1A2235] text-white px-5 py-4 rounded-xl border border-white/5 mb-4 font-medium" 
              placeholder="e.g. student@university.edu" 
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#4B5563"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 mb-2">Password</Text>
            <TextInput 
              className="bg-[#1A2235] text-white px-5 py-4 rounded-xl border border-white/5 mb-8 font-medium" 
              placeholder="••••••••" 
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#4B5563"
            />

            <TouchableOpacity 
              className={`rounded-2xl py-4 items-center shadow-lg shadow-[#6366F1]/20 ${loading ? 'bg-[#4F46E5]/70' : 'bg-[#4F46E5]'}`}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg tracking-wide">{isLogin ? 'Authenticate' : 'Create Builder Account'}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="mt-6 items-center flex-row justify-center space-x-2" 
              onPress={() => router.replace('/(tabs)')}
            >
              <View className="h-[1px] bg-gray-700/50 flex-1" />
              <Text className="text-gray-500 text-xs font-medium px-4">OR SKIP INTRO</Text>
              <View className="h-[1px] bg-gray-700/50 flex-1" />
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
