import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { socket } from '../../utils/socket';
import { apiRequest } from '../../utils/api';

export default function MyProfileScreen() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'logs'>('projects');

  const fetchProfile = async () => {
    try {
      const data = await apiRequest('/users/me');
      setUser(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (!refreshing) setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  useEffect(() => {
    socket.on('feed_update', (newLog: any) => {
      if (user && newLog.userId === user.id) {
        setUser((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            progressLogs: [newLog, ...(prev.progressLogs || [])]
          };
        });
      }
    });

    return () => {
      socket.off('feed_update');
    };
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const timeSince = (date: string) => {
    if (!date) return 'recently';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  };

  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text className="text-2xl font-extrabold text-white tracking-tight">My Profile</Text>
        <TouchableOpacity 
          className="bg-surfaceLight px-5 py-2 rounded-full border border-border" 
          onPress={() => router.push('/profile/edit')}
        >
          <Text className="text-textPrimary font-bold text-xs uppercase tracking-widest">Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        
        {/* Header Section */}
        <View className="items-center px-6 pt-4 mb-8">
          <View className="w-28 h-28 rounded-5xl bg-surface border-2 border-accent/40 items-center justify-center mb-5 shadow-2xl shadow-accent/20">
            <Text className="text-accentLight text-5xl font-extrabold">{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text className="text-3xl font-bold text-textPrimary mb-1 tracking-tight">{user?.name}</Text>
          <Text className="text-textSecondary font-semibold mb-4 tracking-wide">{user?.university}</Text>
          
          <View className="flex-row items-center space-x-3 mb-4">
             <View className="bg-success/10 px-4 py-1.5 rounded-full border border-success/30">
                <Text className="text-success font-bold text-[10px] uppercase tracking-widest">Active {timeSince(user?.lastActive)}</Text>
             </View>
             <View className="bg-accent/10 px-4 py-1.5 rounded-full border border-accent/30">
                <Text className="text-accentLight font-bold text-[10px] uppercase tracking-widest">📈 {user?.weeklyActivity || 0} Week Updates</Text>
             </View>
          </View>
          
          {user?.bio && (
            <Text className="text-textSecondary text-center px-4 leading-5 text-sm italic">"{user.bio}"</Text>
          )}
        </View>

        {/* Activity Stats */}
        <View className="px-6 mb-8 flex-row justify-between">
          <View className="bg-surface flex-1 mr-3 p-5 rounded-4xl border border-border items-center">
            <Text className="text-3xl font-extrabold text-textPrimary">{user?.memberships?.length || 0}</Text>
            <Text className="text-textTertiary text-[10px] mt-1 font-bold uppercase tracking-widest">Projects</Text>
          </View>
          <View className="bg-surface flex-1 p-5 rounded-4xl border border-border items-center">
            <Text className="text-3xl font-extrabold text-textPrimary">{user?.progressLogs?.length || 0}</Text>
            <Text className="text-textTertiary text-[10px] mt-1 font-bold uppercase tracking-widest">Updates</Text>
          </View>
        </View>

        {/* Skills Section */}
        <View className="px-6 mb-8">
          <Text className="text-sm font-bold text-textTertiary uppercase tracking-widest mb-4">Core Competencies</Text>
          <View className="flex-row flex-wrap">
            {user?.skills && user.skills.length > 0 ? user.skills.map((skill: string, i: number) => (
              <View key={i} className="bg-surfaceLight border border-border px-4 py-2 rounded-2xl mr-2 mb-2">
                <Text className="text-textSecondary text-xs font-bold uppercase tracking-tighter">{skill}</Text>
              </View>
            )) : <Text className="text-textTertiary italic text-sm">No specific skills listed yet.</Text>}
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row px-6 border-b border-border/40 mb-6">
          <TouchableOpacity 
            className={`flex-1 pb-4 items-center ${activeTab === 'projects' ? 'border-b-2 border-accent' : ''}`}
            onPress={() => setActiveTab('projects')}
          >
            <Text className={`font-bold uppercase tracking-widest text-[10px] ${activeTab === 'projects' ? 'text-accentLight' : 'text-textTertiary'}`}>Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 pb-4 items-center ${activeTab === 'logs' ? 'border-b-2 border-accent' : ''}`}
            onPress={() => setActiveTab('logs')}
          >
            <Text className={`font-bold uppercase tracking-widest text-[10px] ${activeTab === 'logs' ? 'text-accentLight' : 'text-textTertiary'}`}>Timeline</Text>
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View className="px-6 mb-20">
          {activeTab === 'projects' && (
            <View>
              {user?.memberships?.length === 0 && <Text className="text-textTertiary text-center italic mt-4">Not involved in any active builds.</Text>}
              {user?.memberships?.map((m: any, idx: number) => (
                <TouchableOpacity 
                  key={idx} 
                  className="bg-surface p-5 mb-3 rounded-4xl border border-border flex-row justify-between items-center"
                  onPress={() => router.push({ pathname: '/project/[id]', params: { id: m.project.id } } as any)}
                >
                  <View className="flex-1 mr-4">
                    <Text className="text-lg font-bold text-textPrimary mb-1" numberOfLines={1}>{m.project.title}</Text>
                    <Text className="text-accentLight text-[10px] font-bold uppercase tracking-widest">{m.role || 'Contributor'}</Text>
                  </View>
                  <Text className="text-textTertiary font-bold text-lg">→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'logs' && (
            <View className="pl-2 mt-2">
              {user?.progressLogs?.length === 0 && <Text className="text-textTertiary text-center italic mt-4">No progress milestones recorded.</Text>}
              {user?.progressLogs?.map((log: any, idx: number) => (
                <View key={idx} className="flex-row mb-8">
                  <View className="w-px h-full bg-border absolute left-2 top-3" />
                  <View className="w-4 h-4 rounded-full bg-accent border-4 border-background z-10 mr-5 mt-1" />
                  <View className="flex-1 bg-surface p-5 rounded-4xl border border-border relative overflow-hidden">
                    <View className="flex-row justify-between items-start mb-2">
                      <TouchableOpacity className="flex-1" onPress={() => router.push({ pathname: '/project/[id]', params: { id: log.projectId } } as any)}>
                         <Text className="font-bold text-accentLight text-xs uppercase tracking-tight" numberOfLines={1}>Project: {log.project?.title || 'Launch'}</Text>
                      </TouchableOpacity>
                      <Text className="text-[10px] text-textTertiary font-bold ml-2">{new Date(log.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text className="text-textSecondary text-sm leading-6">{log.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
