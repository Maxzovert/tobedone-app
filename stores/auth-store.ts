import { create } from "zustand";
import { User } from "@/types";
import { api, loadToken, setToken } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { registerPushWithBackend, unregisterPushToken } from "@/lib/pushRegistration";
import {
  clearAuthStorage,
  getStoredUser,
  getStoredToken,
  setStoredUser,
} from "@/lib/authStorage";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: User) => void;
}

function isUnauthorized(status?: number, error?: string): boolean {
  if (status === 401) return true;
  const msg = (error || "").toLowerCase();
  return msg.includes("unauthorized") || msg.includes("expired token") || msg.includes("invalid");
}

function sessionFrom(user: User, token: string) {
  connectSocket(token);
  void registerPushWithBackend();
  return {
    user,
    token,
    isAuthenticated: true,
    isLoading: false,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    if (!res.success || !res.data) return res.error || "Login failed";
    await setToken(res.data.token);
    await setStoredUser(res.data.user);
    set(sessionFrom(res.data.user, res.data.token));
    return null;
  },

  register: async (name, email, password) => {
    const res = await api.post<{ token: string; user: User }>("/auth/register", {
      name,
      email,
      password,
    });
    if (!res.success || !res.data) return res.error || "Registration failed";
    await setToken(res.data.token);
    await setStoredUser(res.data.user);
    set(sessionFrom(res.data.user, res.data.token));
    return null;
  },

  logout: async () => {
    await unregisterPushToken();
    disconnectSocket();
    await clearAuthStorage();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  hydrate: async () => {
    set({ isLoading: true });

    const token = await getStoredToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null, token: null });
      return;
    }

    await loadToken(token);

    const cachedUser = await getStoredUser();
    if (cachedUser) {
      set(sessionFrom(cachedUser, token));
    } else {
      set({
        user: null,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      connectSocket(token);
    }

    try {
      const res = await api.get<User>("/profile");

      if (res.success && res.data) {
        await setStoredUser(res.data);
        set({ user: res.data, token, isAuthenticated: true, isLoading: false });
        connectSocket(token);
        return;
      }

      if (isUnauthorized(res.httpStatus, res.error)) {
        disconnectSocket();
        await clearAuthStorage();
        set({ isLoading: false, isAuthenticated: false, user: null, token: null });
        return;
      }

      if (!cachedUser) {
        set({ isLoading: false, isAuthenticated: true, token });
      }
    } catch {
      if (!cachedUser) {
        set({ isLoading: false, isAuthenticated: true, token });
      }
    }
  },

  setUser: (user) => {
    void setStoredUser(user);
    set({ user });
  },
}));
