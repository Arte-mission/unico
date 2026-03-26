import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_URL, MOCK_TOKEN } from '../../utils/constants';
import { apiRequest } from '../../utils/api';
import { socket } from '../../utils/socket';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchInitData();

    socket.emit('join_project_room', id);

    socket.on('receive_message', (msg: any) => {
      if (msg.projectId === id) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    return () => {
      socket.off('receive_message');
    };
  }, [id]);

  const fetchInitData = async () => {
    try {
      const me = await apiRequest('/users/me');
      setCurrentUser(me);

      const msgs = await apiRequest(`/projects/${id}/messages`);
      setMessages(msgs);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !currentUser) return;

    // We emit directly via Socket.io based on the requirements!
    socket.emit('send_message', {
      projectId: id,
      senderId: currentUser.id,
      content: inputText.trim()
    });

    setInputText('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = currentUser && item.senderId === currentUser.id;

    return (
      <View className={`w-full flex-row ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isMe && (
          <TouchableOpacity 
            className="w-8 h-8 rounded-full bg-accent/20 items-center justify-center mr-2 border border-accent/50"
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.senderId } } as any)}
          >
            <Text className="text-accent font-bold text-xs">{item.sender?.name?.charAt(0) || 'U'}</Text>
          </TouchableOpacity>
        )}
        <View className={`max-w-[75%] rounded-2xl p-3 ${isMe ? 'bg-accent rounded-br-none' : 'bg-secondary rounded-bl-none border border-gray-700'}`}>
          {!isMe && <Text className="text-xs font-bold text-gray-400 mb-1">{item.sender?.name}</Text>}
          <Text className={`${isMe ? 'text-white' : 'text-gray-200'} text-sm leading-5`}>{item.content}</Text>
          <Text className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200/70' : 'text-gray-500'}`}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2">
          <Text className="text-accent font-bold text-lg">← Back</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-bold text-textPrimary">Project Board</Text>
          <Text className="text-xs text-gray-400">Secure Team Chat</Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-10 italic">No messages yet. Start the conversation!</Text>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="px-4 py-3 bg-secondary border-t border-gray-800 flex-row items-end pb-8">
          <TextInput
            className="flex-1 bg-background text-textPrimary px-4 py-3 rounded-2xl border border-gray-700 min-h-[44px] max-h-32"
            placeholder="Type a message..."
            placeholderTextColor="#64748b"
            multiline
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            className={`ml-3 rounded-full w-11 h-11 items-center justify-center ${inputText.trim() ? 'bg-accent' : 'bg-gray-700'} mb-0.5`}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text className="text-white text-sm font-bold">➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
