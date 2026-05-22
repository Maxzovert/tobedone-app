import { create } from "zustand";
import { User } from "@/types";
import { api, loadToken, setToken } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { registerPushWithBackend, unregisterPushToken } from "@/lib/pushRegistration";

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

export const useAuthStore = create<AuthState>((set, get) => ({
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
    connectSocket(res.data.token);
    set({
      user: res.data.user,
      token: res.data.token,
      isAuthenticated: true,
    });
    void registerPushWithBackend();
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
    connectSocket(res.data.token);
    set({
      user: res.data.user,
      token: res.data.token,
      isAuthenticated: true,
    });
    void registerPushWithBackend();
    return null;
  },

  logout: async () => {
    await unregisterPushToken();
    await setToken(null);
    disconnectSocket();
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
      connectSocket(token);
      set({
        user: res.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      await setToken(null);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),
}));
