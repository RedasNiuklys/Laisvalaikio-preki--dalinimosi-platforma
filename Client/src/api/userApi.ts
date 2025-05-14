import axios from 'axios';
import { User, UpdateUserDto } from '../types/User';
import { getAuthToken } from '../utils/authUtils';
import { USER_ENDPOINT } from '../utils/envConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const apiUrl = USER_ENDPOINT;

export const getUsers = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;  // Returns the user data
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${apiUrl}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;  // Returns the user data
  } catch (error) {
    console.error(`Error fetching user with ID ${userId}:`, error);
    throw error;
  }
};

export const createUser = async (userData: User) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(apiUrl, userData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;  // Returns the created user data
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: UpdateUserDto): Promise<User> => {
  try {
    const token = await getAuthToken();
    const response = await axios.put(`${USER_ENDPOINT}/${id}`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    throw error;
  }
};

export const updateUserThemePreference = async (userId: string, themePreference: string) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.patch(`${apiUrl}/${userId}/theme-preference`, {
      themePreference: themePreference
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
    });
    return response.data;  // Returns the updated user data
  } catch (error) {
    console.error(`Error updating user theme preference for user with ID ${userId}:`, error);
    throw error;
  }
};

export const deleteUser = async (userId: number) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${apiUrl}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;  // Returns a success message
  } catch (error) {
    console.error(`Error deleting user with ID ${userId}:`, error);
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${apiUrl}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const uploadProfileImage = async (id: string, imageUri: string): Promise<User> => {
  const token = await getAuthToken();
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
    formData.append("file", file);
  } else {
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg'
    } as any);
  }

  const response = await axios.post(`${USER_ENDPOINT}/${id}/profile-image`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};