import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

export default function CreateProjectModal({ visible, onClose, onSubmit }: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please provide both title and description for your project.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(title, description);
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="bg-secondary rounded-t-3xl border-t border-gray-800">
          <SafeAreaView className="p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-white">Post New Project</Text>
              <TouchableOpacity onPress={onClose} className="p-2">
                <Text className="text-gray-400 font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Project Title</Text>
              <TextInput
                className="bg-background text-white p-4 rounded-xl border border-gray-700 font-semibold"
                placeholder="e.g., Decentralized Identity, ZK-Reputation"
                placeholderTextColor="#64748b"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-400 font-bold mb-2 uppercase text-[10px] tracking-widest">Description (What's it about?)</Text>
              <TextInput
                className="bg-background text-white p-4 rounded-xl border border-gray-700 h-32"
                placeholder="Briefly outline your project goals, stack, and why people should vouch for it."
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                maxLength={300}
              />
            </View>

            <TouchableOpacity
              className={`bg-accent py-4 rounded-xl items-center shadow-lg ${submitting ? 'opacity-70' : ''}`}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">🚀 Launch Project</Text>
              )}
            </TouchableOpacity>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
