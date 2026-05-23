import { create } from "zustand";
import { User } from "@/types";
import { api, loadToken, setToken } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { registerPushWithBackend, unregisterPushToken } from "@/lib/pushRegistration";
import {
  clearAuthStorage,
  getStoredUser,
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
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: async () => {
    set({ isLoading: true });
    const token = await loadToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    const res = await api.get<User>("/profile");

    if (res.success && res.data) {
      await setStoredUser(res.data);
      set(sessionFrom(res.data, token));
      return;
    }

    if (res.httpStatus === 401) {
      await clearAuthStorage();
      set({ isLoading: false, isAuthenticated: false, user: null, token: null });
      return;
    }

    const cachedUser = await getStoredUser();
    if (cachedUser) {
      set(sessionFrom(cachedUser, token));
      return;
    }

    set({
      user: null,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
    connectSocket(token);
    void registerPushWithBackend();
  },

  setUser: (user) => {
    void setStoredUser(user);
    set({ user });
  },
}));
