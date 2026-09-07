import AsyncStorage from '@react-native-async-storage/async-storage';
import type {UserProfile} from '@schoolconnect/shared';

const TOKEN_KEY = 'sc_mobile_token_v1';
const USER_KEY = 'sc_mobile_user_v1';

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  try {
    if (!token) {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      return;
    }
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — session will be in-memory only */
  }
}

export async function saveSession(
  token: string,
  user: UserProfile | null,
): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch {
    /* ignore */
  }
}

export async function loadSession(): Promise<{
  token: string | null;
  user: UserProfile | null;
}> {
  try {
    const [token, raw] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    let user: UserProfile | null = null;
    if (raw) {
      try {
        user = JSON.parse(raw) as UserProfile;
      } catch {
        user = null;
      }
    }
    return {token, user};
  } catch {
    return {token: null, user: null};
  }
}
