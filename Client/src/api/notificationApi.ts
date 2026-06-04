import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../utils/envConfig';

const NOTIFICATION_ENDPOINT = `${BASE_URL}/api/notification`;

export interface NotificationItem {
  id: string;
  type: 'Booking' | 'Chat' | 'System';
  title: string;
  body: string;
  payload?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
}

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('firebaseToken');
  return { Authorization: `Bearer ${token}` };
};

export const getNotifications = async (page = 1, pageSize = 20): Promise<NotificationPage> => {
  const headers = await getHeaders();
  const response = await axios.get(NOTIFICATION_ENDPOINT, {
    headers,
    params: { page, pageSize }
  });
  return response.data;
};

export const markAsRead = async (id: string): Promise<void> => {
  const headers = await getHeaders();
  await axios.patch(`${NOTIFICATION_ENDPOINT}/${id}/read`, {}, { headers });
};

export const markAllAsRead = async (): Promise<void> => {
  const headers = await getHeaders();
  await axios.post(`${NOTIFICATION_ENDPOINT}/read-all`, {}, { headers });
};
