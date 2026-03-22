import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface PostLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, mentions: string[], mediaUrl?: string) => Promise<void>;
  projectId?: string;
}

export default function PostLogModal({ visible, onClose, onSubmit, projectId }: PostLogModalProps) {
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      // Split mentions by comma or space
      const mentionList = mentions.split(/[\s,]+/).filter(m => m.startsWith('@'));
      await onSubmit(content, mentionList);
      setContent('');
      setMentions('');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="bg-background rounded-t-3xl p-6 h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-textPrimary">Post Update log</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-gray-400 font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-gray-400 mb-2 font-semibold text-sm">Update Context</Text>
              <TextInput
                className="bg-secondary text-textPrimary px-4 py-4 rounded-xl border border-gray-700 min-h-[120px]"
                placeholder="What did you build today?"
                placeholderTextColor="#64748b"
                multiline
                textAlignVertical="top"
                value={content}
                onChangeText={setContent}
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-400 mb-2 font-semibold text-sm">Tag Collaborators</Text>
              <TextInput
                className="bg-secondary text-textPrimary px-4 py-3 rounded-xl border border-gray-700"
                placeholder="@username, @designer"
                placeholderTextColor="#64748b"
                value={mentions}
                onChangeText={setMentions}
              />
            </View>
            
            <View className="flex-row items-center justify-between bg-secondary p-4 rounded-xl border border-gray-700 mb-6">
               <Text className="text-textPrimary">Add Media (Optional)</Text>
               <TouchableOpacity className="bg-gray-700 px-3 py-1 rounded">
                 <Text className="text-white text-xs">Upload</Text>
               </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity 
            className={`py-4 items-center rounded-xl shadow-sm ${content ? 'bg-accent' : 'bg-gray-700'}`}
            disabled={!content || isLoading}
            onPress={handleSubmit}
          >
            <Text className="text-white font-semibold text-lg">{isLoading ? 'Posting...' : 'Post Update'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
