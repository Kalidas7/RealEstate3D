import AsyncStorage from '@react-native-async-storage/async-storage';

const DEV = 'https://realestate3d-dev.onrender.com';
const PROD = 'https://realestate3d.onrender.com';
const LOCAL = 'http://192.168.1.6:8000';
const LOCAL_KALIDAS = 'http://192.168.1.6:8000';
const LOCAL_ARJUN = 'http://192.168.0.105:8000';

const ENV = LOCAL_ARJUN; // Switch to DEV/PROD for remote servers

export const API_BASE = ENV;
export const API_URL = `${ENV}/api`;

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
