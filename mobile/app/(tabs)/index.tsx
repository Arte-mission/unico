import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { socket } from '../../utils/socket';
import { apiRequest } from '../../utils/api';
import PostLogModal from '../components/PostLogModal';
import CreateProjectModal from '../components/CreateProjectModal';

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins || 1}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const ProjectItem = memo(({ item, router }: { item: any, router: any }) => {
  const isActive = Date.now() - new Date(item.lastUpdated).getTime() < 86400000;
  const isNew = Date.now() - new Date(item.createdAt).getTime() < 86400000 * 2;

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      className="bg-secondary p-5 mb-4 rounded-3xl shadow-md border border-gray-800 relative"
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } } as any)}
    >
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row space-x-2">
          {isActive && <View className="bg-red-500/20 px-2 py-0.5 rounded-md border border-red-500/50"><Text className="text-red-400 text-[10px] font-bold uppercase tracking-wider">🔥 Active</Text></View>}
          <View className="bg-accent/20 px-2 py-0.5 rounded-md border border-accent/50">
            <Text className="text-accent text-[10px] font-bold uppercase tracking-wider">Score: {item.validationScore || 0}</Text>
          </View>
        </View>
        <Text className="text-[10px] text-gray-500 font-bold uppercase">{timeAgo(item.lastUpdated)}</Text>
      </View>

      <Text className="text-xl font-bold text-white mb-1">{item.title}</Text>
      <Text className="text-gray-400 text-xs mb-3 font-semibold">{item.owner?.name} • {item.owner?.university}</Text>
      <Text className="text-gray-300 mb-4 font-sans leading-5" numberOfLines={3}>{item.description}</Text>
      
      {item.progressLogs?.length > 0 && (
        <View className="bg-background/40 p-3 rounded-2xl mb-4 border border-gray-700/50">
          <Text className="text-[10px] text-accent font-bold mb-1 uppercase tracking-widest">Latest Progress</Text>
          <Text className="text-gray-300 text-xs leading-4" numberOfLines={2}>{item.progressLogs[0].content}</Text>
        </View>
      )}

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3">
            {item.members?.slice(0, 3).map((m: any, i: number) => (
              <View key={i} style={{ zIndex: 10 - i }} className={`w-7 h-7 rounded-full bg-accent items-center justify-center border-2 border-secondary ${i > 0 ? '-ml-2.5' : ''}`}>
                 <Text className="text-white text-[10px] font-bold">{m.user?.name?.charAt(0) || 'U'}</Text>
              </View>
            ))}
            {item.members?.length > 3 && (
              <View className="w-7 h-7 rounded-full bg-gray-700 items-center justify-center border-2 border-secondary -ml-2.5">
                <Text className="text-gray-400 text-[8px] font-bold">+{item.members.length - 3}</Text>
              </View>
            )}
          </View>
          <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{item.members?.length || 1} Build Partners</Text>
        </View>
        
        <TouchableOpacity 
          className="bg-accent px-6 py-2 rounded-full"
          onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } } as any)}
        >
          <Text className="text-white text-xs font-bold">View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default function FeedScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const fetchProjects = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await apiRequest(`/projects`);
      setProjects(data);
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('feed_update', () => fetchProjects());
    socket.on('project_updated', () => fetchProjects());
    socket.on('new_project_created', () => fetchProjects());

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('feed_update');
      socket.off('project_updated');
      socket.off('new_project_created');
    };
  }, []);

  const onRefresh = useCallback(() => {
    fetchProjects(true);
  }, []);

  const handleCreateProject = async (title: string, description: string) => {
    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({ title, description })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ProjectItem item={item} router={router} />
  ), [router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2 border-b border-gray-800 flex-row justify-between items-center">
        <View>
          <Text className="text-3xl font-bold text-white tracking-tight">Unico</Text>
          <View className="flex-row items-center mt-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              {isConnected ? 'Real-time Feed' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </View>

      {loading && projects.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList 
          data={projects}
          keyExtractor={item => item.id}
          onRefresh={onRefresh}
          refreshing={refreshing}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <Text className="text-gray-500 text-center text-lg italic">No projects found. Launch one!</Text>
            </View>
          }
          renderItem={renderItem}
          removeClippedSubviews={true}
          initialNumToRender={5}
        />
      )}

      <TouchableOpacity 
        className="absolute bottom-10 right-6 bg-accent px-6 py-4 rounded-3xl flex-row items-center shadow-2xl border border-white/10"
        onPress={() => setCreateModalVisible(true)}
      >
        <Text className="text-white font-bold text-lg">Launch Project</Text>
      </TouchableOpacity>

      <CreateProjectModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} onSubmit={handleCreateProject} />
    </SafeAreaView>
  );
}
