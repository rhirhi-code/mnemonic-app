import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#4A90D9' }}>
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="recap"
        options={{
          title: 'Recap',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color as string} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
