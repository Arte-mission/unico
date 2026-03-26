import { Alert } from 'react-native';
import { API_URL, MOCK_TOKEN } from './constants';

const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 10000; // 10 seconds

export async function apiRequest(path: string, options: any = {}) {
  const url = `${API_URL}${path}`;
  const isGet = !options.method || options.method === 'GET';
  
  // Basic Cache Check
  if (isGet && !options.noCache && cache[url] && (Date.now() - cache[url].timestamp < CACHE_DURATION)) {
    console.log(`🧠 [API CACHE HIT] ${url}`);
    return cache[url].data;
  }

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MOCK_TOKEN}`,
    ...options.headers
  };

  try {
    console.log(`📡 [API REQUEST] ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, { ...options, headers });
    const json = await response.json();

    if (!response.ok || json.success === false) {
      console.error(`🛑 [API ERROR] ${response.status} ${url}:`, json.error || 'Unknown error');
      throw new Error(json.error || `Request failed with status ${response.status}`);
    }

    // Standardized Success Response: { success: true, data: ... }
    const responseData = json.success !== undefined ? json.data : json;

    // Save to cache
    if (isGet) {
       cache[url] = { data: responseData, timestamp: Date.now() };
    } else {
       // Clear cache on mutations
       Object.keys(cache).forEach(k => delete cache[k]);
    }

    return responseData;
  } catch (error: any) {
    console.error(`🙅 [NETWORK ERROR] ${url}:`, error.message);
    
    // Show user friendly alert
    Alert.alert(
      'Connection Issue',
      error.message || 'Could not connect to the server. Please check your network and ensure the backend is running.',
      [{ text: 'Retry', onPress: () => {} }]
    );
    
    throw error;
  }
}
