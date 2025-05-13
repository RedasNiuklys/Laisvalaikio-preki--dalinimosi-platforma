import axios from 'axios';
import { User } from '../types/User';
import { USER_ENDPOINT } from '../utils/envConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const updateUser = async (userData: User) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.put(`${apiUrl}/${userData.id}`, userData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;  // Returns the updated user data
  } catch (error) {
    console.error(`Error updating user with ID ${userData.id}:`, error);
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