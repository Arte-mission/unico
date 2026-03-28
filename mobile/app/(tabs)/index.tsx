import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, RefreshControl, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { socket } from '../../utils/socket';
import { apiRequest } from '../../utils/api';
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
  const isUpdating = Date.now() - new Date(item.lastUpdated).getTime() < 172800000; // 2 days

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      className="bg-surface p-6 mb-4 rounded-4xl border border-border/60"
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } } as any)}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row space-x-2">
          {item.validationScore > 50 && (
            <View className="bg-success/10 px-3 py-1 rounded-full border border-success/30">
              <Text className="text-success text-[10px] font-bold uppercase tracking-widest">High Impact</Text>
            </View>
          )}
          <View className="bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
            <Text className="text-accentLight text-[10px] font-bold uppercase tracking-widest">
              Score: {item.validationScore || 0}
            </Text>
          </View>
        </View>
        <Text className="text-[10px] text-textTertiary font-bold uppercase tracking-tighter">
          {isUpdating ? 'Recent Activity' : timeAgo(item.lastUpdated)}
        </Text>
      </View>

      <Text className="text-2xl font-bold text-textPrimary mb-1" style={{ letterSpacing: -0.5 }}>{item.title}</Text>
      <Text className="text-textSecondary text-xs mb-4 font-semibold uppercase tracking-widest">
        {item.owner?.name} • {item.owner?.university}
      </Text>
      
      <Text className="text-textSecondary/80 text-sm leading-6 mb-6" numberOfLines={3}>
        {item.description}
      </Text>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3">
            {item.members?.slice(0, 3).map((m: any, i: number) => (
              <View 
                key={i} 
                style={{ zIndex: 10 - i }} 
                className={`w-8 h-8 rounded-full bg-accentDark items-center justify-center border-2 border-surface ${i > 0 ? '-ml-3' : ''}`}
              >
                  <Text className="text-white text-xs font-bold">{m.user?.name?.charAt(0) || 'U'}</Text>
              </View>
            ))}
            {item.members?.length > 3 && (
              <View className="w-8 h-8 rounded-full bg-surfaceLight items-center justify-center border-2 border-surface -ml-3">
                <Text className="text-textSecondary text-[10px] font-bold">+{item.members.length - 3}</Text>
              </View>
            )}
          </View>
          <Text className="text-[10px] text-textTertiary font-bold uppercase">
            {item.members?.length || 1} Build Partner{item.members?.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View className="flex-row items-center">
            <Text className="text-accentLight font-bold text-xs mr-2">View</Text>
            <View className="w-6 h-6 rounded-full bg-accent/20 items-center justify-center">
                 <Text className="text-accent text-xs">🚀</Text>
            </View>
        </View>
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
      if (!isRefresh) setLoading(false);
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
      <StatusBar barStyle="light-content" />
      <View className="px-6 pt-6 pb-4 flex-row justify-between items-end">
        <View>
          <Text className="text-textTertiary text-xs font-bold uppercase tracking-widest mb-1">Collaborative Launchpad</Text>
          <Text className="text-4xl font-extrabold text-white tracking-tighter">Explore</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <View className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-success' : 'bg-danger'} border-2 border-background`} />
          <Text className="text-textTertiary text-[10px] font-bold uppercase tracking-widest">
            {isConnected ? 'Real-time' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {loading && projects.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-textSecondary mt-4 font-bold uppercase tracking-widest text-[10px]">Assembling Feed</Text>
        </View>
      ) : (
        <FlatList 
          data={projects}
          keyExtractor={item => item.id}
          onRefresh={onRefresh}
          refreshing={refreshing}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          ListEmptyComponent={
            <View className="items-center mt-32 px-10">
              <View className="w-20 h-20 bg-surface rounded-full items-center justify-center mb-6">
                 <Text className="text-4xl">🌑</Text>
              </View>
              <Text className="text-textSecondary text-center text-lg font-semibold mb-2">The feed is silent</Text>
              <Text className="text-textTertiary text-center text-sm">Be the first to ignite a project today.</Text>
            </View>
          }
          renderItem={renderItem}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={7}
        />
      )}

      <TouchableOpacity 
        activeOpacity={0.9}
        className="absolute bottom-10 left-1/4 right-1/4 h-16 bg-accent rounded-full flex-row items-center justify-center shadow-2xl shadow-accent/50 border border-white/20"
        onPress={() => setCreateModalVisible(true)}
      >
        <Text className="text-white font-extrabold text-lg mr-2">New Project</Text>
        <Text className="text-lg">✨</Text>
      </TouchableOpacity>

      <CreateProjectModal visible={createModalVisible} onClose={() => setCreateModalVisible(false)} onSubmit={handleCreateProject} />
    </SafeAreaView>
  );
}
