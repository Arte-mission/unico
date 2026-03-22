import { View, Text, SafeAreaView } from 'react-native';

export default function ChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background justify-center items-center">
      <Text className="text-xl text-textPrimary font-bold">Messages</Text>
      <Text className="text-gray-400 mt-2">Your team chats will appear here.</Text>
    </SafeAreaView>
  );
}
