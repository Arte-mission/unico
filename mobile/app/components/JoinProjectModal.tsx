import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

interface JoinProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (role: string, commitmentLevel: string) => Promise<void>;
  projectTitle?: string;
}

export default function JoinProjectModal({ visible, onClose, onSubmit, projectTitle }: JoinProjectModalProps) {
  const [role, setRole] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!role.trim() || !commitmentLevel.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit(role, commitmentLevel);
      setRole('');
      setCommitmentLevel('');
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
        <View className="bg-background rounded-3xl p-6 w-full border border-gray-800 shadow-xl">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-xl font-bold text-textPrimary">Join Project</Text>
              <Text className="text-sm text-gray-400 mt-1" numberOfLines={1}>{projectTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Text className="text-gray-400 font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-gray-400 mb-2 font-semibold text-sm">Desired Role / Contribution</Text>
            <TextInput
              className="bg-secondary text-textPrimary px-4 py-3 rounded-xl border border-gray-700"
              placeholder="e.g. Frontend Dev, UI Designer"
              placeholderTextColor="#64748b"
              value={role}
              onChangeText={setRole}
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 mb-2 font-semibold text-sm">Time Commitment</Text>
            <TextInput
              className="bg-secondary text-textPrimary px-4 py-3 rounded-xl border border-gray-700"
              placeholder="e.g. 10 hrs/week, Full-time"
              placeholderTextColor="#64748b"
              value={commitmentLevel}
              onChangeText={setCommitmentLevel}
            />
          </View>

          <TouchableOpacity 
            className={`py-4 items-center rounded-xl shadow-sm ${role && commitmentLevel ? 'bg-accent' : 'bg-gray-700'}`}
            disabled={!role || !commitmentLevel || isLoading}
            onPress={handleSubmit}
          >
            <Text className="text-white font-semibold text-lg">{isLoading ? 'Joining...' : 'Request to Join'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
