import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../../src/pages/ProfileScreen';
import UserFormScreen from '../../src/pages/UserFormScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  UserForm: { userId?: number } | undefined; // Optionally pass a userId for editing
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerStyle: { backgroundColor: '#F8F8F8' },
        headerTintColor: '#333333',
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Your Profile' }}
      />
      <Stack.Screen
        name="UserForm"
        component={UserFormScreen}
        options={{ title: 'Edit Profile' }}
      />
    </Stack.Navigator>
  );
}
