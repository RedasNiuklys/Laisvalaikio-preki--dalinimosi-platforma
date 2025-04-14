import axios from 'axios';
import { User } from '../types/User';
import Constants from 'expo-constants';


const apiUrl = Constants.expoConfig?.extra?.API_apiUrl + '/user';

export const getUsers = async () => {
  try {
    const response = await axios.get(apiUrl);
    return response.data;  // Returns the user data
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (userId: number) => {
  try {
    const response = await axios.get(`${apiUrl}/${userId}`);
    return response.data;  // Returns the user data
  } catch (error) {
    console.error(`Error fetching user with ID ${userId}:`, error);
    throw error;
  }
};

export const createUser = async (userData: User) => {
  try {
    const response = await axios.post(apiUrl, userData);
    return response.data;  // Returns the created user data
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userData: User) => {
  try {
    const response = await axios.put(`${apiUrl}/${userData.id}`, userData);
    return response.data;  // Returns the updated user data
  } catch (error) {
    console.error(`Error updating user with ID ${userData.id}:`, error);
    throw error;
  }
};

export const deleteUser = async (userId: number) => {
  try {
    const response = await axios.delete(`${apiUrl}/${userId}`);
    return response.data;  // Returns a success message
  } catch (error) {
    console.error(`Error deleting user with ID ${userId}:`, error);
    throw error;
  }
};