import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiRequest } from '../../utils/api';
import { socket } from '../../utils/socket';
import JoinProjectModal from '../components/JoinProjectModal';
import PostLogModal from '../components/PostLogModal';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [postModalVisible, setPostModalVisible] = useState(false);

  useEffect(() => {
    fetchInitialData();
    socket.emit('join_project_room', id);

    socket.on('new_progress_log', (log: any) => {
      setProject((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          progressLogs: [log, ...(prev.progressLogs || [])]
        };
      });
    });

    socket.on('member_joined', (member: any) => {
      setProject((prev: any) => {
        if (!prev) return prev;
        const alreadyMember = prev.members?.some((m: any) => m.userId === member.userId);
        if (alreadyMember) return prev;
        return {
          ...prev,
          members: [...(prev.members || []), member]
        };
      });
    });

    return () => {
      socket.off('new_progress_log');
      socket.off('member_joined');
    };
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [projectData, userData] = await Promise.all([
        apiRequest(`/projects/${id}`),
        apiRequest('/users/me')
      ]);
      setProject(projectData);
      setMe(userData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProject = async (message: string, contribution: string) => {
    try {
      const data = await apiRequest(`/projects/${id}/join`, {
        method: 'POST',
        body: JSON.stringify({ message, contribution })
      });
      if (data) {
        Alert.alert('Request Sent', 'Your request to join has been sent to the project owner.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to send join request. You might have already requested.');
    }
  };

  const handlePostLog = async (content: string, mentions: string[], mediaUrl?: string) => {
    try {
      await apiRequest(`/logs/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content, mediaUrl })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !project) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  const isOwner = me?.id === project.createdBy;
  const isMember = project.members?.some((m: any) => m.userId === me?.id);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/40">
        <TouchableOpacity onPress={() => router.back()} className="mr-5 p-1 rounded-full bg-surface">
          <Text className="text-accentLight font-extrabold text-lg"> ← </Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white flex-1" numberOfLines={1}>Build Mission</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Project Card */}
        <View className="bg-surface p-6 rounded-4xl border border-border mb-8 shadow-2xl">
          <View className="flex-row justify-between items-start mb-3">
             <Text className="text-3xl font-extrabold text-textPrimary flex-1 tracking-tight">{project.title}</Text>
             <View className="bg-accent/10 px-3 py-1.5 rounded-full border border-accent/30 ml-2">
                <Text className="text-accentLight text-[10px] font-bold">SCORE {project.validationScore || 0}</Text>
             </View>
          </View>
          
          <Text className="text-sm text-textTertiary mb-6 font-bold uppercase tracking-widest">{project.owner?.name} • {project.owner?.university}</Text>
          <Text className="text-[15px] text-textSecondary leading-7 font-medium">{project.description}</Text>
          
          <View className="flex-row items-center mt-8 space-x-3">
            {!isMember && (
              <TouchableOpacity 
                activeOpacity={0.8}
                className="flex-1 bg-accent h-14 rounded-full items-center justify-center border border-white/20"
                onPress={() => setJoinModalVisible(true)}
              >
                <Text className="text-white font-extrabold text-sm uppercase tracking-widest">Join Project</Text>
              </TouchableOpacity>
            )}
 
            {isOwner && (
              <TouchableOpacity 
                activeOpacity={0.8}
                className="flex-1 bg-surfaceLight h-14 rounded-full items-center justify-center border border-border"
                onPress={() => router.push({ pathname: '/project/requests', params: { id: id } } as any)}
              >
                <Text className="text-textPrimary font-extrabold text-sm uppercase tracking-widest">Requests</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              activeOpacity={0.8}
              className="w-20 bg-surfaceLight h-14 rounded-full items-center justify-center border border-border"
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: id } } as any)}
            >
              <Text className="text-lg">💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Team Section */}
        <View className="mb-8">
           <View className="flex-row justify-between items-end mb-5 px-1">
             <Text className="text-sm font-bold text-textTertiary uppercase tracking-widest">Team ({project.members?.length || 0})</Text>
           </View>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1">
             {project.members?.map((m: any, idx: number) => (
               <TouchableOpacity 
                 key={idx} 
                 className="bg-surface px-6 py-4 rounded-3xl mr-3 border border-border flex-row items-center"
                 onPress={() => router.push({ pathname: '/profile/[id]', params: { id: m.userId } } as any)}
               >
                 <View className="w-8 h-8 rounded-full bg-accent/20 items-center justify-center mr-3">
                    <Text className="text-accent text-xs font-bold">{m.user?.name?.charAt(0) || 'U'}</Text>
                 </View>
                 <View>
                    <Text className="text-textPrimary font-bold text-sm">{m.user?.name || 'Anonymous'}</Text>
                    <Text className="text-textTertiary text-[10px] font-bold uppercase">{m.role || 'Partner'}</Text>
                 </View>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

        {/* Roles Section */}
        <View className="mb-8 px-1">
          <Text className="text-sm font-bold text-textTertiary uppercase tracking-widest mb-4">Open Missions</Text>
          <View className="flex-row flex-wrap">
            {['Frontend Architect', 'Fullstack Engineer', 'UI Specialist', 'Product Ops'].map((role, i) => (
              <View key={i} className="bg-surface border border-border px-4 py-2 rounded-2xl mr-2 mb-2">
                <Text className="text-textSecondary text-xs font-bold uppercase tracking-tighter">{role}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Logs Section */}
        <View className="flex-row justify-between items-center mb-6 px-1">
          <Text className="text-sm font-bold text-textTertiary uppercase tracking-widest">Progress Stream</Text>
          <TouchableOpacity 
            className="bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20"
            onPress={() => setPostModalVisible(true)}
          >
            <Text className="text-accentLight font-bold text-[10px] uppercase tracking-widest">+ Update</Text>
          </TouchableOpacity>
        </View>
        
        <View className="mb-20 pl-2">
          {project.progressLogs?.length === 0 && (
            <Text className="text-textTertiary italic text-center py-10">No updates broadcasted yet.</Text>
          )}
          {project.progressLogs?.map((log: any, idx: number) => (
            <View key={idx} className="flex-row mb-8">
              <View className="w-px h-full bg-border absolute left-2 top-3" />
              <View className="w-4 h-4 rounded-full bg-accent border-4 border-background z-10 mr-5 mt-1" />
              <View className="flex-1 bg-surface p-5 rounded-4xl border border-border shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                  <TouchableOpacity onPress={() => router.push({ pathname: '/profile/[id]', params: { id: log.userId } } as any)}>
                    <Text className="font-bold text-textPrimary text-sm">{log.user?.name || 'Builder'}</Text>
                  </TouchableOpacity>
                  <Text className="text-[10px] text-textTertiary font-bold">{new Date(log.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text className="text-textSecondary text-sm leading-6">{log.content}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      <JoinProjectModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSubmit={handleJoinProject}
        projectTitle={project.title}
      />
      
      <PostLogModal 
        visible={postModalVisible} 
        onClose={() => setPostModalVisible(false)} 
        onSubmit={handlePostLog}
        projectId={id as string}
      />
    </SafeAreaView>
  );
}
