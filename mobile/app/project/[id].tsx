import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_URL, MOCK_TOKEN } from '../../utils/constants';
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

    // Join room for real-time updates
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
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <Text className="text-accent font-bold text-lg">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white flex-1" numberOfLines={1}>{project.title}</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <View className="bg-secondary p-5 rounded-3xl shadow-md border border-gray-800 mb-6">
          <View className="flex-row justify-between items-start mb-2">
             <Text className="text-2xl font-bold text-white flex-1">{project.title}</Text>
             <View className="bg-accent/20 px-3 py-1 rounded-full border border-accent/50">
                <Text className="text-accent text-xs font-bold">Score: {project.validationScore || 0}</Text>
             </View>
          </View>
          
          <Text className="text-sm text-gray-400 mb-4 font-semibold">{project.owner?.name}, {project.owner?.university}</Text>
          <Text className="text-base text-gray-300 font-sans leading-6">{project.description}</Text>
          
          <View className="flex-row items-center mt-6 space-x-3">
            {!isMember && (
              <TouchableOpacity 
                className="flex-1 bg-accent py-3 rounded-full items-center shadow-sm"
                onPress={() => setJoinModalVisible(true)}
              >
                <Text className="text-white font-semibold">Join Project</Text>
              </TouchableOpacity>
            )}
 
            {isOwner && (
              <TouchableOpacity 
                className="flex-1 bg-gray-800 py-3 rounded-full items-center border border-gray-700 flex-row justify-center"
                onPress={() => router.push({ pathname: '/project/requests', params: { id: id } } as any)}
              >
                <Text className="text-white font-semibold">Join Requests</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              className="bg-gray-800 py-3 px-5 rounded-full items-center border border-gray-700 flex-row"
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: id } } as any)}
            >
              <Text className="text-white font-semibold">💬 Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-lg font-bold text-white mb-3 mt-2 px-1">Team Members ({project.members?.length || 0})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {project.members?.map((m: any, idx: number) => (
            <TouchableOpacity 
              key={idx} 
              className="bg-gray-800 px-4 py-2 rounded-2xl mr-3 border border-gray-700"
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: m.userId } } as any)}
            >
              <Text className="text-white font-semibold">{m.user?.name || 'Anonymous'}</Text>
              <Text className="text-accent text-xs">{m.role}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text className="text-lg font-bold text-white mb-3 px-1">Open Roles</Text>
        <View className="mb-6 flex-row flex-wrap">
          {['Frontend Dev', 'UI/UX Designer', 'Growth Marketer'].map((role, i) => (
            <View key={i} className="bg-background border border-gray-700 px-3 py-1.5 rounded-full mr-2 mb-2">
              <Text className="text-gray-300 text-sm">{role}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row justify-between items-center mb-4 px-1">
          <Text className="text-lg font-bold text-white">Progress Logs</Text>
          <TouchableOpacity onPress={() => setPostModalVisible(true)}>
            <Text className="text-accent font-semibold">+ Post</Text>
          </TouchableOpacity>
        </View>
        
        <View className="mb-10 pl-2">
          {project.progressLogs?.length === 0 && (
            <Text className="text-gray-500 italic">No progress logs yet.</Text>
          )}
          {project.progressLogs?.map((log: any, idx: number) => (
            <View key={idx} className="flex-row mb-6">
              <View className="w-px h-full bg-gray-700 absolute left-2 top-3" />
              <View className="w-4 h-4 rounded-full bg-accent border-4 border-background z-10 mr-4 mt-1" />
              <View className="flex-1 bg-secondary p-4 rounded-2xl border border-gray-800 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <TouchableOpacity onPress={() => router.push({ pathname: '/profile/[id]', params: { id: log.userId } } as any)}>
                    <Text className="font-bold text-white">{log.user?.name || 'Builder'}</Text>
                  </TouchableOpacity>
                  <Text className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text className="text-gray-300 text-sm">{log.content}</Text>
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
