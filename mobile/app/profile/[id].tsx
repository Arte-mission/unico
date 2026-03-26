import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiRequest } from '../../utils/api';
import { socket } from '../../utils/socket';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'logs'>('projects');

  useEffect(() => {
    fetchProfile();
    // ... socket listeners ...
  }, [id]);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest(`/users/${id}`);
      if (data) {
        setUser(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-accent font-bold text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-textPrimary">Profile</Text>
        <View className="w-10" /> 
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent items-center justify-center mb-4">
            <Text className="text-accent text-3xl font-bold">{user.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text className="text-2xl font-bold text-textPrimary mb-1">{user.name}</Text>
          <Text className="text-gray-400 font-medium mb-1">{user.university}</Text>
          
          <View className="flex-row items-center mt-2 space-x-2">
            <View className="bg-accent/20 px-3 py-1 rounded-full border border-accent/40">
              <Text className="text-accent text-[10px] font-bold uppercase">Weekly Activity: {user.weeklyActivity || 0}</Text>
            </View>
            <View className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
              <Text className="text-gray-400 text-[10px] font-bold uppercase">Active: {timeAgo(user.lastActive)}</Text>
            </View>
          </View>

          <Text className="text-gray-300 text-center mt-4 px-6 italic">"{user.bio || 'Building the future.'}"</Text>
          
          <View className="flex-row items-center justify-center mt-6 w-full">
            <TouchableOpacity 
              className="flex-1 mx-2 bg-accent py-3 rounded-xl items-center shadow-sm"
              onPress={() => alert('Connection request sent!')}
            >
              <Text className="text-white font-semibold">Connect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Skills Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-white mb-3">Top Skills</Text>
          <View className="flex-row flex-wrap">
            {user.skills && user.skills.length > 0 ? user.skills.map((skill: string, i: number) => (
              <View key={i} className="bg-secondary border border-gray-700 px-3 py-1.5 rounded-lg mr-2 mb-2">
                <Text className="text-gray-300 text-sm">{skill}</Text>
              </View>
            )) : <Text className="text-gray-500 italic text-sm">No skills listed</Text>}
          </View>
        </View>

        {/* Activity Stats */}
        <View className="mb-6 flex-row justify-between">
          <View className="bg-secondary flex-1 mr-2 p-4 rounded-2xl border border-gray-800 items-center shadow-sm">
            <Text className="text-3xl font-bold text-textPrimary">{user.memberships?.length || 0}</Text>
            <Text className="text-gray-400 text-xs mt-1 font-semibold text-center uppercase tracking-wider">Projects Joined</Text>
          </View>
          <View className="bg-secondary flex-1 ml-2 p-4 rounded-2xl border border-gray-800 items-center shadow-sm">
            <Text className="text-3xl font-bold text-textPrimary">{user.progressLogs?.length || 0}</Text>
            <Text className="text-gray-400 text-xs mt-1 font-semibold text-center uppercase tracking-wider">Updates Posted</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-800 mb-4">
          <TouchableOpacity 
            className={`flex-1 pb-3 items-center ${activeTab === 'projects' ? 'border-b-2 border-accent' : ''}`}
            onPress={() => setActiveTab('projects')}
          >
            <Text className={`font-semibold ${activeTab === 'projects' ? 'text-accent' : 'text-gray-500'}`}>Active Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 pb-3 items-center ${activeTab === 'logs' ? 'border-b-2 border-accent' : ''}`}
            onPress={() => setActiveTab('logs')}
          >
            <Text className={`font-semibold ${activeTab === 'logs' ? 'text-accent' : 'text-gray-500'}`}>Timeline</Text>
          </TouchableOpacity>
        </View>

        {/* Active Projects Content */}
        {activeTab === 'projects' && (
          <View className="mb-10">
            {user.memberships?.length === 0 && <Text className="text-gray-500 text-center italic mt-4">Not involved in any projects yet.</Text>}
            {user.memberships?.map((m: any, idx: number) => (
              <TouchableOpacity 
                key={idx} 
                className="bg-secondary p-4 mb-3 rounded-2xl border border-gray-800 flex-row justify-between items-center"
                onPress={() => router.push({ pathname: '/project/[id]', params: { id: m.project.id } } as any)}
              >
                <View className="flex-1">
                  <Text className="text-lg font-bold text-textPrimary mb-1" numberOfLines={1}>{m.project.title}</Text>
                  <Text className="text-accent text-xs font-semibold">{m.role}</Text>
                </View>
                <Text className="text-gray-500 font-bold">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timeline Logs Content */}
        {activeTab === 'logs' && (
          <View className="mb-10 pl-2 mt-2">
            {user.progressLogs?.length === 0 && <Text className="text-gray-500 text-center italic mt-4">No progress logs posted.</Text>}
            {user.progressLogs?.map((log: any, idx: number) => (
              <View key={idx} className="flex-row mb-6">
                <View className="w-px h-full bg-gray-700 absolute left-2 top-3" />
                <View className="w-4 h-4 rounded-full bg-accent border-4 border-background z-10 mr-4 mt-1" />
                <View className="flex-1 bg-secondary p-4 rounded-2xl border border-gray-800 shadow-sm">
                  <View className="flex-row justify-between items-start mb-2">
                    <TouchableOpacity onPress={() => router.push({ pathname: '/project/[id]', params: { id: log.projectId } } as any)}>
                       <Text className="font-bold text-accent text-xs mb-1 uppercase">Project: {log.project?.title || 'Unknown'}</Text>
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text className="text-gray-300 text-sm">{log.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Future Ready Placeholders */}
        <View className="mt-2 mb-10 pt-6 border-t border-gray-800">
           <Text className="text-lg font-bold text-white mb-4">Reputation & Network</Text>
           <View className="bg-background border border-dashed border-gray-700 p-4 rounded-2xl mb-3 items-center">
             <Text className="text-gray-500 italic text-sm font-semibold">🔒 "Would work with again" Endorsements (Coming Soon)</Text>
           </View>
           <View className="bg-background border border-dashed border-gray-700 p-4 rounded-2xl items-center">
             <Text className="text-gray-500 italic text-sm font-semibold">🔒 Collaborator Graph Sandbox (Coming Soon)</Text>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
