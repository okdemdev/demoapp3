import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
          height: 75,
          paddingTop: 12,
          paddingBottom: 24,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarActiveTintColor: '#FF7D49',
        tabBarInactiveTintColor: '#666666',
        tabBarIconStyle: {
          width: 36,
          height: 36,
        },
      }}
    >
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="calendar" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'To-Do',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="list" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="bar-chart" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="users" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="gear" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
