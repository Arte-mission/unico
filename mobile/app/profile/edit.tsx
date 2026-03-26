import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiRequest } from '../../utils/api';

export default function EditProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState(''); // comma separated string for input
  const [university, setUniversity] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest('/users/me');
      setUser(data);
      setName(data.name || '');
      setBio(data.bio || '');
      setUniversity(data.university || '');
      setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const updatedUser = await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          bio,
          university,
          skills: skillsArray
        })
      });

      if (updatedUser) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
            <Text className="text-accent font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} className="p-2">
            <Text className={`font-bold text-lg ${saving ? 'text-gray-500' : 'text-accent'}`}>{saving ? '...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-10">
            <View className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent items-center justify-center mb-4">
              <Text className="text-accent text-3xl font-bold">{name.charAt(0) || 'U'}</Text>
            </View>
            <TouchableOpacity className="bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
              <Text className="text-white font-semibold text-xs text-center uppercase tracking-wider">Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 mb-2 font-bold text-xs uppercase tracking-wider">Full Name</Text>
            <TextInput
              className="bg-secondary text-textPrimary px-4 py-4 rounded-2xl border border-gray-700 font-semibold"
              placeholder="Your name"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 mb-2 font-bold text-xs uppercase tracking-wider">Bio</Text>
            <TextInput
              className="bg-secondary text-textPrimary px-4 py-4 rounded-2xl border border-gray-700 min-h-[100]"
              placeholder="Tell others about yourself..."
              placeholderTextColor="#64748b"
              multiline
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
            />
          </View>

          <View className="mb-6">
            <Text className="text-gray-400 mb-2 font-bold text-xs uppercase tracking-wider">University</Text>
            <TextInput
              className="bg-secondary text-textPrimary px-4 py-4 rounded-2xl border border-gray-700 font-semibold"
              placeholder="e.g. Macquarie University"
              placeholderTextColor="#64748b"
              value={university}
              onChangeText={setUniversity}
            />
          </View>

          <View className="mb-10">
            <Text className="text-gray-400 mb-2 font-bold text-xs uppercase tracking-wider">Skills (Comma Separated)</Text>
            <TextInput
              className="bg-secondary text-textPrimary px-4 py-4 rounded-2xl border border-gray-700 font-semibold"
              placeholder="React, TypeScript, UI/UX"
              placeholderTextColor="#64748b"
              value={skills}
              onChangeText={setSkills}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}