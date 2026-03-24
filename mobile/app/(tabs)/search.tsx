import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../utils/constants';
import { socket } from '../../utils/socket';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'projects' | 'users'>('all');
  const [results, setResults] = useState<{ projects: any[], users: any[] }>({ projects: [], users: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchSearchResults();
    }, 400);
    return () => clearTimeout(timer);
  }, [query, filter]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&type=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderProjectItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      className="bg-secondary p-4 mb-3 rounded-2xl border border-gray-800 flex-row justify-between items-center"
      onPress={() => router.push({ pathname: '/project/[id]', params: { id: item.id } } as any)}
    >
      <View className="flex-1 mr-3">
        <Text className="text-lg font-bold text-textPrimary mb-1" numberOfLines={1}>{item.title}</Text>
        <Text className="text-gray-400 text-sm" numberOfLines={2}>{item.description}</Text>
        <View className="flex-row items-center mt-2">
           <Text className="text-xs text-accent font-semibold bg-gray-800 px-2 py-1 rounded border border-gray-700">
             {item.members?.length || 1} Members
           </Text>
        </View>
      </View>
      <Text className="text-gray-500 font-bold">→</Text>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      className="bg-secondary p-4 mb-3 rounded-2xl border border-gray-800 flex-row items-center"
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } } as any)} 
    >
      <View className="w-12 h-12 rounded-full bg-accent/20 items-center justify-center mr-4 border border-accent/50">
        <Text className="text-accent font-bold text-lg">{item.name?.charAt(0) || 'U'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-textPrimary">{item.name}</Text>
        <Text className="text-gray-400 text-sm">{item.university}</Text>
      </View>
      <Text className="text-gray-500 font-bold">→</Text>
    </TouchableOpacity>
  );

  const combinedData = [
    ...(filter === 'all' || filter === 'projects' ? results.projects.map(p => ({ ...p, _type: 'project' })) : []),
    ...(filter === 'all' || filter === 'users' ? results.users.map(u => ({ ...u, _type: 'user' })) : [])
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 border-b border-gray-800 pb-4">
        <Text className="text-2xl font-bold text-textPrimary mb-4">Discover</Text>
        
        {/* Search Bar */}
        <View className="bg-secondary flex-row items-center px-4 py-3 rounded-xl border border-gray-700">
           <Text className="text-gray-400 mr-2 text-lg">🔍</Text>
           <TextInput 
             className="flex-1 text-textPrimary font-sans text-base"
             placeholder="Search projects, skills, or builders..."
             placeholderTextColor="#64748b"
             value={query}
             onChangeText={setQuery}
           />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
           {['all', 'projects', 'users'].map((f) => (
             <TouchableOpacity 
               key={f} 
               className={`px-4 py-2 rounded-full mr-3 border ${filter === f ? 'bg-accent border-accent' : 'bg-transparent border-gray-600'}`}
               onPress={() => setFilter(f as any)}
             >
               <Text className={`font-semibold capitalize ${filter === f ? 'text-white' : 'text-gray-400'}`}>{f}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>
      </View>

      {/* Results List */}
      <View className="flex-1 px-4 pt-4">
        {loading && <ActivityIndicator size="small" color="#6366F1" className="mb-4" />}
        
        <FlatList 
          data={combinedData}
          keyExtractor={(item) => `${item._type}_${item.id}`}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={11}
          removeClippedSubviews={true}
          ListEmptyComponent={
            !loading ? (
              <View className="items-center justify-center mt-10">
                <Text className="text-gray-500 text-center">No results found for "{query}"</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            if (item._type === 'project') return renderProjectItem({ item });
            if (item._type === 'user') return renderUserItem({ item });
            return null;
          }}
        />
      </View>
    </SafeAreaView>
  );
}
