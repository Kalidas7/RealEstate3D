import AsyncStorage from '@react-native-async-storage/async-storage';

// Local dev: 'http://192.168.1.6:8000'
export const API_BASE = 'https://realestate3d.onrender.com';
export const API_URL = 'https://realestate3d.onrender.com/api';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...(options.headers as Record<string, string> || {}),
  };
  return fetch(url, { ...options, headers });
}
