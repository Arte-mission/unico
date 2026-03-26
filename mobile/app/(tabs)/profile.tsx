import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { socket } from '../utils/socket';

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
      setLoading(false);
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

    socket.on('project_updated', (updatedProject: any) => {
      if (!user) return;
      setUser((prev: any) => {
        if (!prev) return prev;
        
        const isMember = updatedProject.members?.some((m: any) => m.userId === user.id);
        if (isMember) {
          const alreadyExists = prev.memberships?.some((m: any) => m.projectId === updatedProject.id);
          if (!alreadyExists) {
            const newMembership = {
              project: updatedProject,
              role: 'Contributor' 
            };
            return {
              ...prev,
              memberships: [...(prev.memberships || []), newMembership]
            };
          }
        }
        return prev;
      });
    });

    return () => {
      socket.off('feed_update');
      socket.off('project_updated');
    };
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "just now";
  };

  const memoizedMemberships = useMemo(() => {
    return user?.memberships || [];
  }, [user?.memberships]);

  const memoizedLogs = useMemo(() => {
    return user?.progressLogs || [];
  }, [user?.progressLogs]);

  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
        <Text className="text-2xl font-bold text-textPrimary">My Profile</Text>
        <TouchableOpacity className="bg-gray-800 px-4 py-2 rounded-full border border-gray-700" onPress={() => router.push('/profile/edit')}>
          <Text className="text-white font-bold text-sm">Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        
        {/* Header Section */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent items-center justify-center mb-4 shadow-lg shadow-accent/50">
            <Text className="text-accent text-4xl font-bold">{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text className="text-2xl font-bold text-textPrimary mb-1">{user?.name}</Text>
          <Text className="text-gray-400 font-medium mb-1">{user?.university}</Text>
          <View className="flex-row items-center space-x-3 mb-2">
             <View className="bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
                <Text className="text-green-500 font-bold text-xs uppercase tracking-widest">Active {timeSince(user?.lastActive)}</Text>
             </View>
             <View className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                <Text className="text-blue-500 font-bold text-xs">📈 {user?.weeklyActivity || 0} Week Updates</Text>
             </View>
          </View>
          {user?.bio ? (
            <Text className="text-gray-400 text-center px-6 mt-2 italic text-sm">"{user.bio}"</Text>
          ) : null}
        </View>

        {/* Skills Section */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-white mb-3">Top Skills</Text>
          <View className="flex-row flex-wrap">
            {user?.skills && user.skills.length > 0 ? user.skills.map((skill: string, i: number) => (
              <View key={i} className="bg-secondary border border-gray-700 px-3 py-1.5 rounded-lg mr-2 mb-2">
                <Text className="text-gray-300 text-sm font-semibold">{skill}</Text>
              </View>
            )) : <Text className="text-gray-500 italic text-sm">No skills listed</Text>}
          </View>
        </View>

        {/* Activity Stats */}
        <View className="mb-6 flex-row justify-between">
          <View className="bg-secondary flex-1 mr-2 p-4 rounded-2xl border border-gray-800 items-center shadow-sm">
            <Text className="text-4xl font-bold text-textPrimary">{user?.memberships?.length || 0}</Text>
            <Text className="text-gray-400 text-xs mt-1 font-semibold text-center uppercase tracking-wider">Projects</Text>
          </View>
          <View className="bg-secondary flex-1 ml-2 p-4 rounded-2xl border border-gray-800 items-center shadow-sm">
            <Text className="text-4xl font-bold text-textPrimary">{user?.progressLogs?.length || 0}</Text>
            <Text className="text-gray-400 text-xs mt-1 font-semibold text-center uppercase tracking-wider">Updates</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-800 mb-6 sticky top-0 bg-background pt-2 z-10">
          <TouchableOpacity 
            className={`flex-1 pb-3 items-center ${activeTab === 'projects' ? 'border-b-2 border-accent' : ''}`}
            onPress={() => setActiveTab('projects')}
          >
            <Text className={`font-bold uppercase tracking-widest text-xs ${activeTab === 'projects' ? 'text-accent' : 'text-gray-500'}`}>Active Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 pb-3 items-center ${activeTab === 'logs' ? 'border-b-2 border-accent' : ''}`}
            onPress={() => setActiveTab('logs')}
          >
            <Text className={`font-bold uppercase tracking-widest text-xs ${activeTab === 'logs' ? 'text-accent' : 'text-gray-500'}`}>Timeline</Text>
          </TouchableOpacity>
        </View>

        {/* Active Projects Content */}
        {activeTab === 'projects' && (
          <View className="mb-10">
            {memoizedMemberships.length === 0 && <Text className="text-gray-500 text-center italic mt-4">Not involved in any projects yet.</Text>}
            {memoizedMemberships.map((m: any, idx: number) => (
              <TouchableOpacity 
                key={idx} 
                className="bg-secondary p-4 mb-3 rounded-2xl border border-gray-800 flex-row justify-between items-center shadow-lg"
                onPress={() => router.push({ pathname: '/project/[id]', params: { id: m.project.id } } as any)}
              >
                <View className="flex-1">
                  <Text className="text-lg font-bold text-textPrimary mb-1" numberOfLines={1}>{m.project.title}</Text>
                  <Text className="text-accent text-xs font-bold uppercase tracking-widest">{m.role}</Text>
                </View>
                <Text className="text-gray-500 font-bold text-lg">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timeline Logs Content */}
        {activeTab === 'logs' && (
          <View className="mb-10 pl-2 mt-2">
            {memoizedLogs.length === 0 && <Text className="text-gray-500 text-center italic mt-4">No progress logs posted.</Text>}
            {memoizedLogs.map((log: any, idx: number) => (
              <View key={idx} className="flex-row mb-6">
                <View className="w-px h-full bg-gray-700 absolute left-2 top-3" />
                <View className="w-4 h-4 rounded-full bg-accent border-4 border-background z-10 mr-4 mt-1" />
                <View className="flex-1 bg-secondary p-4 rounded-2xl border border-gray-800 shadow-sm relative overflow-hidden">
                  <View className="bg-accent/5 absolute right-0 top-0 bottom-0 w-1" />
                  <View className="flex-row justify-between items-start mb-2">
                    <TouchableOpacity onPress={() => router.push({ pathname: '/project/[id]', params: { id: log.projectId } } as any)}>
                       <Text className="font-bold text-accent text-xs mb-1 uppercase tracking-tighter">Project: {log.project?.title || 'Unknown'}</Text>
                    </TouchableOpacity>
                    <Text className="text-[10px] text-gray-500 font-bold uppercase">{new Date(log.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text className="text-gray-300 text-sm leading-5">{log.content}</Text>
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
