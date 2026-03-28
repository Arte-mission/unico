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

const AUSTRALIAN_UNIVERSITIES = [
  { name: 'University of New South Wales (UNSW)', domains: ['unsw.edu.au', 'student.unsw.edu.au'] },
  { name: 'Macquarie University', domains: ['mq.edu.au', 'students.mq.edu.au'] },
  { name: 'University of Sydney', domains: ['sydney.edu.au', 'uni.sydney.edu.au'] },
  { name: 'University of Melbourne', domains: ['unimelb.edu.au', 'student.unimelb.edu.au'] },
  { name: 'Monash University', domains: ['monash.edu', 'student.monash.edu'] },
  { name: 'University of Queensland', domains: ['uq.edu.au', 'student.uq.edu.au'] },
  { name: 'Australian National University', domains: ['anu.edu.au', 'u.anu.edu.au'] },
  { name: 'University of Western Australia', domains: ['uwa.edu.au', 'student.uwa.edu.au'] },
  { name: 'University of Adelaide', domains: ['adelaide.edu.au', 'student.adelaide.edu.au'] },
  { name: 'RMIT University', domains: ['rmit.edu.au', 'student.rmit.edu.au'] },
  { name: 'Queensland University of Technology (QUT)', domains: ['qut.edu.au', 'student.qut.edu.au'] },
  { name: 'University of Technology Sydney (UTS)', domains: ['uts.edu.au', 'student.uts.edu.au'] },
  { name: 'Curtin University', domains: ['curtin.edu.au', 'student.curtin.edu.au'] },
  { name: 'Deakin University', domains: ['deakin.edu.au', 'student.deakin.edu.au'] },
  { name: 'Griffith University', domains: ['griffith.edu.au', 'student.griffith.edu.au'] },
  { name: 'University of Newcastle', domains: ['newcastle.edu.au', 'uon.edu.au'] },
  { name: 'University of Wollongong', domains: ['uow.edu.au', 'uowmail.edu.au'] },
  { name: 'La Trobe University', domains: ['latrobe.edu.au', 'students.latrobe.edu.au'] },
  { name: 'Swinburne University of Technology', domains: ['swinburne.edu.au', 'student.swinburne.edu.au'] },
  { name: 'Bond University', domains: ['bond.edu.au', 'student.bond.edu.au'] }
];

export default function AuthScreen() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [university, setUniversity] = useState('');
  const [showSub, setShowSub] = useState(false);

  const filteredUnis = AUSTRALIAN_UNIVERSITIES.filter(u => 
    u.name.toLowerCase().includes(university.toLowerCase())
  );

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter email and password');
      return;
    }

    if (!isLogin) {
      if (!name) {
        Alert.alert('Required Fields', 'Please enter your full name for registration');
        return;
      }
      
      const selectedUni = AUSTRALIAN_UNIVERSITIES.find(u => u.name === university);
      if (!selectedUni) {
        Alert.alert('Invalid Selection', 'Please select a valid Australian University from the dropdown list.');
        return;
      }
      
      const emailDomain = email.split('@')[1];
      if (!emailDomain || !selectedUni.domains.includes(emailDomain.toLowerCase())) {
         Alert.alert(
           'Invalid Email Format', 
           `Your email doesn't match the selected university.\n\nPlease use an official email ending in:\n${selectedUni.domains.map(d => '@'+d).join(' or ')}`
         );
         return;
      }
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
        // Since we explicitly checked university validity above, it's safe to use `university` state directly.
        const data = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, university })
        });
        if (data) {
          Alert.alert('Success', 'Welcome to Unico! Please login to your new builder account.', [
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
          <View className="bg-[#111726]/80 p-6 rounded-3xl border border-white/5 shadow-2xl z-10">
            
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

                <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 mb-2">University (Australia)</Text>
                <TextInput 
                  className={`bg-[#1A2235] text-white px-5 py-4 border border-white/5 font-medium ${showSub && filteredUnis.length > 0 ? 'rounded-t-xl' : 'rounded-xl mb-4'}`} 
                  placeholder="Search Australian University..." 
                  value={university}
                  onFocus={() => setShowSub(true)}
                  onChangeText={(val) => { setUniversity(val); setShowSub(true); }}
                  placeholderTextColor="#4B5563"
                  autoCapitalize="words"
                />
                
                {/* Search Dropdown Overlay Inline */}
                {showSub && filteredUnis.length > 0 && (
                  <View className="bg-[#1F2937] border border-white/10 border-t-0 rounded-b-xl mb-4 max-h-48 overflow-hidden">
                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={true}>
                      {filteredUnis.map((uni, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          className="px-5 py-4 border-b border-white/5 bg-[#1F2937] active:bg-[#374151]"
                          onPress={() => {
                            setUniversity(uni.name);
                            setShowSub(false);
                          }}
                        >
                          <Text className="text-white text-sm font-medium">{uni.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </>
            )}

            {/* Standard Login/Reg fields */}
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-2 mb-2">Email Address</Text>
            <TextInput 
              className="bg-[#1A2235] text-white px-5 py-4 rounded-xl border border-white/5 mb-4 font-medium" 
              placeholder={isLogin ? "e.g. student@mq.edu.au" : "Must match your selected university"}
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
