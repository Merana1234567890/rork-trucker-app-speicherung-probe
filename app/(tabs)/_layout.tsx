import { Tabs } from 'expo-router';
import React from 'react';
import { 
  Home, 
  Fuel, 
  Clock, 
  CheckSquare, 
  Receipt,
  Map 
} from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="fuel-log"
        options={{
          title: 'Tankbuch',
          tabBarIcon: ({ color, size }) => <Fuel color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="drive-times"
        options={{
          title: 'Lenkzeiten',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: 'Checklisten',
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Spesen',
          tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Karte',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}