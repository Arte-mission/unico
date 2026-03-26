import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiRequest } from '../../utils/api';

export default function JoinRequestsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [id]);

  const fetchRequests = async () => {
    try {
      const data = await apiRequest(`/projects/${id}/requests`);
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await apiRequest(`/projects/${id}/requests/${requestId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ status, role: 'Contributor' })
      });
      Alert.alert('Success', `Request ${status === 'ACCEPTED' ? 'accepted' : 'rejected'}.`);
      fetchRequests();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to respond to request.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <Text className="text-accent font-bold text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white flex-1">Join Requests</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {requests.length === 0 && (
          <View className="items-center mt-20">
            <Text className="text-gray-500 italic text-lg">No pending requests.</Text>
          </View>
        )}
        
        {requests.map((req) => (
          <View key={req.id} className="bg-secondary p-5 rounded-3xl border border-gray-800 mb-4">
            <View className="flex-row items-center mb-4">
               <View className="w-12 h-12 rounded-full bg-accent/20 items-center justify-center mr-3">
                  <Text className="text-accent font-bold text-lg">{req.user.name.charAt(0)}</Text>
               </View>
               <TouchableOpacity onPress={() => router.push({ pathname: '/profile/[id]', params: { id: req.user.id } } as any)}>
                 <Text className="text-lg font-bold text-white">{req.user.name}</Text>
                 <Text className="text-sm text-gray-400">{req.user.university}</Text>
               </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 font-bold text-xs uppercase mb-1">Why join?</Text>
              <Text className="text-gray-300 text-sm italic">"{req.message}"</Text>
            </View>

            <View className="mb-6">
              <Text className="text-gray-400 font-bold text-xs uppercase mb-1">Contribution</Text>
              <Text className="text-gray-300 text-sm italic">"{req.contribution}"</Text>
            </View>

            <View className="flex-row items-center justify-between">
               <View className="flex-row flex-wrap flex-1 mr-4">
                  {JSON.parse(req.user.skills || '[]').map((skill: string, i: number) => (
                    <View key={i} className="bg-background border border-gray-700 px-2 py-0.5 rounded-lg mr-1 mb-1">
                      <Text className="text-gray-400 text-[10px]">{skill}</Text>
                    </View>
                  ))}
               </View>
               
               <View className="flex-row space-x-2">
                 <TouchableOpacity 
                   className="bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/50"
                   onPress={() => handleRespond(req.id, 'REJECTED')}
                 >
                   <Text className="text-red-500 font-bold text-sm">Decline</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   className="bg-green-500/20 px-4 py-2 rounded-xl border border-green-500/50"
                   onPress={() => handleRespond(req.id, 'ACCEPTED')}
                 >
                   <Text className="text-green-500 font-bold text-sm">Accept</Text>
                 </TouchableOpacity>
               </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
