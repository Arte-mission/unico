import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface JoinProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (message: string, contribution: string) => Promise<void>;
  projectTitle?: string;
}

export default function JoinProjectModal({ visible, onClose, onSubmit, projectTitle }: JoinProjectModalProps) {
  const [message, setMessage] = useState('');
  const [contribution, setContribution] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !contribution.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit(message, contribution);
      setMessage('');
      setContribution('');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center items-center bg-black/60 p-6"
      >
        <View className="bg-background rounded-3xl p-6 w-full border border-gray-800 shadow-xl max-h-[80%]">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text className="text-xl font-bold text-textPrimary">Request to Join</Text>
              <Text className="text-sm text-gray-400 mt-1" numberOfLines={1}>{projectTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Text className="text-gray-400 font-bold text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-gray-400 mb-2 font-semibold text-sm">Why do you want to join?</Text>
              <TextInput
                className="bg-secondary text-textPrimary px-4 py-3 rounded-xl border border-gray-700 min-h-[80]"
                placeholder="Share your motivation..."
                placeholderTextColor="#64748b"
                multiline
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            <View className="mb-8">
              <Text className="text-gray-400 mb-2 font-semibold text-sm">What can you contribute?</Text>
              <TextInput
                className="bg-secondary text-textPrimary px-4 py-3 rounded-xl border border-gray-700 min-h-[80]"
                placeholder="Mention your skills and relevant experience..."
                placeholderTextColor="#64748b"
                multiline
                textAlignVertical="top"
                value={contribution}
                onChangeText={setContribution}
              />
            </View>

            <TouchableOpacity 
              className={`py-4 items-center rounded-xl shadow-sm ${message && contribution ? 'bg-accent' : 'bg-gray-700'}`}
              disabled={!message || !contribution || isLoading}
              onPress={handleSubmit}
            >
              <Text className="text-white font-semibold text-lg">{isLoading ? 'Sending Request...' : 'Send Request'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
