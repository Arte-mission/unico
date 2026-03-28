import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { 
        backgroundColor: '#0B0F1A', 
        borderTopColor: '#1E293B',
        height: 60,
        paddingBottom: 10,
        paddingTop: 5
      },
      tabBarActiveTintColor: '#6366F1',
      tabBarInactiveTintColor: '#64748b',
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1
      }
    }}>
      <Tabs.Screen name="index" options={{ 
        title: 'Feed',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🌀</Text>
      }} />
      <Tabs.Screen name="search" options={{ 
        title: 'Explore',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔭</Text>
      }} />
      <Tabs.Screen name="chat" options={{ 
        title: 'Chat',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💭</Text>
      }} />
      <Tabs.Screen name="profile" options={{ 
        title: 'Profile',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💎</Text>
      }} />
    </Tabs>
  );
}
