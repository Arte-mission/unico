import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { socket } from '../utils/socket';
import PostLogModal from '../components/PostLogModal';
import JoinProjectModal from '../components/JoinProjectModal';

// Using localhost for now. In iOS emulator it's localhost:3000, Android is 10.0.2.2:3000
const API_URL = 'http://localhost:3000/api';

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export default function FeedScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Post Log Modal State
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  // Join Project Modal State
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinProjectId, setJoinProjectId] = useState<string | undefined>(undefined);
  const [joinProjectTitle, setJoinProjectTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchProjects(1, true);

    // Socket.io Real-time update listener for new progress logs
    socket.on('feed_update', (newLog: any) => {
      console.log('New log on feed:', newLog);
      
      setProjects(prevProjects => {
        const index = prevProjects.findIndex(p => p.id === newLog.projectId);
        if (index === -1) return prevProjects;
        
        const project = { ...prevProjects[index] };
        project.progressLogs = [newLog, ...(project.progressLogs || [])];
        project.lastUpdated = new Date().toISOString();
        
        const filtered = prevProjects.filter(p => p.id !== newLog.projectId);
        return [project, ...filtered];
      });
    });

    // Socket.io listener for project updates (like new members joining)
    socket.on('project_updated', (updatedProject: any) => {
      setProjects(prevProjects => {
        const index = prevProjects.findIndex(p => p.id === updatedProject.id);
        if (index === -1) return prevProjects;
        const newProjects = [...prevProjects];
        // Merge the updated members count while keeping current feed logs state 
        newProjects[index] = { ...newProjects[index], members: updatedProject.members };
        return newProjects;
      });
    });

    return () => {
      socket.off('feed_update');
      socket.off('project_updated');
    };
  }, []);

  const fetchProjects = async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/projects?page=${pageNum}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        if (data.length < 5) setHasMore(false);
        else setHasMore(true);

        if (isRefresh) {
          setProjects(data);
        } else {
          // Prevent duplicates when appending
          setProjects(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProjects = data.filter((d: any) => !existingIds.has(d.id));
            return [...prev, ...newProjects];
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
      Alert.alert('Error', 'Failed to load feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProjects(nextPage, false);
    }
  };

  const onRefresh = () => {
    setPage(1);
    fetchProjects(1, true);
  };

  const handlePostLog = async (content: string, mentions: string[], mediaUrl?: string) => {
    if (!selectedProjectId) {
      Alert.alert("Error", "Please select a project to post to.");
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/logs/${selectedProjectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_MOCK_TOKEN' // Mock token for demo
        },
        body: JSON.stringify({ content, mediaUrl })
      });
      // The socket event will auto-update the feed if successful
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to post progress log.');
    }
  };

  const handleJoinProject = async (role: string, commitmentLevel: string) => {
    if (!joinProjectId) return;
    
    try {
      const res = await fetch(`${API_URL}/projects/${joinProjectId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_MOCK_TOKEN' // Mock token for demo
        },
        body: JSON.stringify({ role, commitmentLevel })
      });
      
      if (res.ok) {
        Alert.alert('Success', `You successfully joined ${joinProjectTitle}!`);
      } else {
        const data = await res.json();
        Alert.alert('Notice', data.error || 'Could not join project.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An error occurred while joining.');
    }
  };

  const openPostModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setPostModalVisible(true);
  };

  const openJoinModal = (projectId: string, projectTitle: string) => {
    setJoinProjectId(projectId);
    setJoinProjectTitle(projectTitle);
    setJoinModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2 border-b border-gray-800 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-textPrimary">Project Feed</Text>
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#6366F1" className="mt-10" />
      ) : (
        <FlatList 
          data={projects}
          keyExtractor={item => item.id}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListFooterComponent={hasMore && projects.length > 0 ? <ActivityIndicator size="small" color="#6366F1" className="my-4" /> : null}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-gray-400 text-center mt-10">No projects found. Create one to get started!</Text>}
          renderItem={({ item }) => {
            const isNew = Date.now() - new Date(item.createdAt).getTime() < 86400000 * 2;
            const isActive = Date.now() - new Date(item.lastUpdated).getTime() < 86400000;

            return (
              <View className="bg-secondary p-5 mb-4 rounded-3xl shadow-md border border-gray-800 relative">
                <View className="flex-row space-x-2 mb-2">
                  {isActive && <View className="bg-red-500/20 px-2 py-0.5 rounded-md border border-red-500/50"><Text className="text-red-400 text-[10px] font-bold uppercase tracking-wider">🔥 Active</Text></View>}
                  {isNew && !isActive && <View className="bg-accent/20 px-2 py-0.5 rounded-md border border-accent/50"><Text className="text-accent text-[10px] font-bold uppercase tracking-wider">🌟 New</Text></View>}
                </View>

                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-xl font-bold text-textPrimary flex-1 mr-2">{item.title}</Text>
                  <Text className="text-xs text-gray-400 font-semibold">
                    {timeAgo(item.lastUpdated)}
                  </Text>
                </View>
              <Text className="text-gray-300 mb-2 font-sans">{item.description}</Text>
              
              {/* Latest Progress Log Snippet */}
              {item.progressLogs?.length > 0 && (
                <View className="bg-background/50 p-3 rounded-xl mb-4 border border-gray-700">
                  <Text className="text-xs text-accent font-bold mb-1">Latest Update:</Text>
                  <Text className="text-gray-300 text-sm" numberOfLines={2}>{item.progressLogs[0].content}</Text>
                </View>
              )}

              <View className="flex-row justify-between items-center mt-2">
                <View className="flex-row items-center space-x-2">
                  <View className="flex-row items-center">
                    {item.members?.slice(0, 3).map((m: any, i: number) => (
                      <View key={i} style={{ zIndex: 10 - i }} className={`w-6 h-6 rounded-full bg-accent items-center justify-center border-2 border-secondary ${i > 0 ? '-ml-2' : ''}`}>
                         <Text className="text-white text-[10px] font-bold">{m.user?.name?.charAt(0) || 'U'}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="flex-row space-x-1">
                    <View className="bg-background px-2 py-1 rounded-md">
                      <Text className="text-[10px] text-gray-400 font-semibold">{item.members?.length || 1} joined</Text>
                    </View>
                    <View className="bg-background px-2 py-1 rounded-md">
                      <Text className="text-[10px] text-gray-400 font-semibold">{item._count?.progressLogs || item.progressLogs?.length || 0} updates</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row space-x-2">
                  <TouchableOpacity 
                    className="bg-gray-700 px-4 py-2 rounded-full"
                    onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } } as any)}
                  >
                    <Text className="text-white text-sm font-semibold">View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="bg-accent px-4 py-2 rounded-full shadow-sm"
                    onPress={() => openJoinModal(item.id, item.title)}
                  >
                    <Text className="text-white text-sm font-semibold">Join</Text>
                  </TouchableOpacity>
                </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* global FAB for Posting an Update without selecting from card initially */}
      <TouchableOpacity 
        className="absolute bottom-6 right-6 bg-accent px-5 py-3 rounded-full flex-row items-center shadow-lg border border-accent/80"
        onPress={() => openPostModal(projects[0]?.id)}
      >
        <Text className="text-white text-lg font-extrabold mr-2">+</Text>
        <Text className="text-white font-bold text-sm">Post Update</Text>
      </TouchableOpacity>

      <PostLogModal 
        visible={postModalVisible} 
        onClose={() => setPostModalVisible(false)} 
        onSubmit={handlePostLog}
        projectId={selectedProjectId}
      />

      <JoinProjectModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSubmit={handleJoinProject}
        projectTitle={joinProjectTitle}
      />
    </SafeAreaView>
  );
}
