import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { apiRequest } from '../../utils/api';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ projects: any[], users: any[] }>({ projects: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<'all' | 'projects' | 'users'>('all');

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ projects: [], users: [] });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest(`/search?q=${encodeURIComponent(q)}&type=${activeType}`);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    const delay = setTimeout(() => handleSearch(query), 400);
    return () => clearTimeout(delay);
  }, [query, activeType]);

  const renderProject = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      className="bg-surface p-5 mb-3 rounded-4xl border border-border"
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } } as any)}
    >
      <View className="flex-row justify-between mb-1">
        <Text className="text-lg font-bold text-textPrimary flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
        <Text className="text-accentLight font-bold text-[10px] uppercase tracking-widest">{item.validationScore || 0}</Text>
      </View>
      <Text className="text-textTertiary text-xs font-bold uppercase tracking-tighter mb-2">{item.owner?.name} • {item.owner?.university}</Text>
      <Text className="text-textSecondary text-xs leading-5" numberOfLines={2}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      className="bg-surface p-5 mb-3 rounded-4xl border border-border flex-row items-center"
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } } as any)}
    >
      <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center mr-4">
        <Text className="text-accent text-lg font-bold">{item.name?.charAt(0) || 'U'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-textPrimary font-bold text-base">{item.name}</Text>
        <Text className="text-textTertiary text-xs uppercase tracking-widest font-bold">{item.university}</Text>
      </View>
      <Text className="text-textTertiary font-bold">→</Text>
    </TouchableOpacity>
  );

  const listData = activeType === 'projects' ? results.projects : activeType === 'users' ? results.users : [...results.projects.map(p => ({ ...p, _kind: 'project' })), ...results.users.map(u => ({ ...u, _kind: 'user' }))];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      
      <View className="px-6 pt-6 pb-4">
        <Text className="text-4xl font-extrabold text-white tracking-tighter mb-6">Explore</Text>
        
        <View className="bg-surface p-4 rounded-3xl border border-border flex-row items-center mb-6">
          <Text className="mr-3 opacity-50">🔍</Text>
          <TextInput 
            className="flex-1 text-textPrimary font-semibold"
            placeholder="Projects, talent, or missions..."
            placeholderTextColor="#64748B"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>

        <View className="flex-row space-x-2 mb-2">
            {['all', 'projects', 'users'].map((t) => (
                <TouchableOpacity 
                    key={t}
                    onPress={() => setActiveType(t as any)}
                    className={`px-6 py-2 rounded-full border ${activeType === t ? 'bg-accent border-accent' : 'bg-surface border-border'}`}
                >
                    <Text className={`text-[10px] font-bold uppercase tracking-widest ${activeType === t ? 'text-white' : 'text-textTertiary'}`}>{t}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#6366F1" />
        </View>
      ) : (
        <FlatList 
          data={listData}
          keyExtractor={(item, idx) => item.id || idx.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={({ item }: any) => item._kind === 'user' || activeType === 'users' ? renderUser({ item }) : renderProject({ item })}
          ListEmptyComponent={
            query.trim() ? (
              <View className="items-center mt-20">
                <Text className="text-textTertiary italic font-semibold">No matches for your search.</Text>
              </View>
            ) : (
              <View className="items-center mt-20 px-10">
                <Text className="text-textTertiary text-center text-sm font-bold uppercase tracking-widest opacity-50">Discovery Mode Active</Text>
                <Text className="text-textSecondary text-center text-xs mt-2 italic">Search for skills like "React", "Marketing", or university names.</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
