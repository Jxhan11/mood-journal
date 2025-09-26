import axios, { AxiosInstance, AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, MoodEntry, AuthResponse, ApiError } from "../types/store";

// Configure your backend URL here
// Use 10.0.2.2 for Android emulator, 127.0.0.1 for iOS simulator
const API_BASE_URL = "http://10.237.70.248:8000";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(async (config) => {
      // Get token from persisted Zustand store
      try {
        const storeData = await AsyncStorage.getItem("mood-journal-store");
        if (storeData) {
          const parsedStore = JSON.parse(storeData);
          const token = parsedStore.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error("Error getting token from store:", error);
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, logout user
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleAuthError() {
    // Clear the token from Zustand store
    try {
      const storeData = await AsyncStorage.getItem("mood-journal-store");
      if (storeData) {
        const parsedStore = JSON.parse(storeData);
        if (parsedStore.state) {
          parsedStore.state.token = null;
          parsedStore.state.user = null;
          parsedStore.state.isAuthenticated = false;
          await AsyncStorage.setItem(
            "mood-journal-store",
            JSON.stringify(parsedStore)
          );
        }
      }
    } catch (error) {
      console.error("Error clearing auth from store:", error);
    }
  }

  // Get authentication token
  async getAuthToken(): Promise<string | null> {
    try {
      const storeData = await AsyncStorage.getItem("mood-journal-store");
      if (storeData) {
        const parsedStore = JSON.parse(storeData);
        return parsedStore.state?.token || null;
      }
      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  // Get base URL for API endpoints
  getBaseURL(): string {
    return this.client.defaults.baseURL || "";
  }

  // Debug function to check token
  async debugToken() {
    try {
      const storeData = await AsyncStorage.getItem("mood-journal-store");
      if (storeData) {
        const parsedStore = JSON.parse(storeData);
        console.log("🔍 Store data:", parsedStore);
        console.log(
          "🔐 Token:",
          parsedStore.state?.token ? "Present" : "Missing"
        );
        console.log(
          "👤 User:",
          parsedStore.state?.user ? "Present" : "Missing"
        );
        console.log("✅ Authenticated:", parsedStore.state?.isAuthenticated);
        return parsedStore.state?.token;
      } else {
        console.log("❌ No store data found");
        return null;
      }
    } catch (error) {
      console.error("❌ Error reading store:", error);
      return null;
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  }

  async signup(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>("/auth/signup", data);
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.client.get<{ user: User }>("/auth/me");
    return response.data;
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>(
      "/auth/logout"
    );
    return response.data;
  }

  // Mood Entries
  async getEntries(params?: {
    limit?: number;
    days?: number;
    offset?: number;
  }): Promise<{
    entries: MoodEntry[];
    pagination: any;
    filters: any;
  }> {
    const response = await this.client.get("/api/entries", { params });
    return response.data;
  }

  async createEntry(data: {
    mood: {
      emoji: string;
      emotion: string;
    };
    text_note?: string;
    entry_date: string;
    local_id?: string;
  }): Promise<{ message: string; entry: MoodEntry }> {
    const response = await this.client.post("/api/entries", data);
    return response.data;
  }

  async getEntry(entryId: string): Promise<{ entry: MoodEntry }> {
    const response = await this.client.get(`/api/entries/${entryId}`);
    return response.data;
  }

  async updateEntry(
    entryId: string,
    data: Partial<{
      mood: {
        emoji: string;
        emotion: string;
      };
      text_note: string;
      entry_date: string;
    }>
  ): Promise<{ message: string; entry: MoodEntry }> {
    const response = await this.client.put(`/api/entries/${entryId}`, data);
    return response.data;
  }

  async deleteEntry(entryId: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/api/entries/${entryId}`);
    return response.data;
  }

  // Audio
  async uploadAudio(
    entryId: string,
    audioUri: string,
    duration?: number
  ): Promise<{ message: string; audio_file: any }> {
    const formData = new FormData();

    formData.append("entry_id", entryId);
    formData.append("audio", {
      uri: audioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);

    if (duration) {
      formData.append("duration", duration.toString());
    }

    const response = await this.client.post("/api/audio/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async deleteAudio(filename: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/audio/${filename}`);
    return response.data;
  }

  // AI Insights
  async getInsight(entryId: string): Promise<{
    insight: string;
    processed: boolean;
    processed_at?: string;
    entry_id: string;
  }> {
    const response = await this.client.get(`/api/insights/entry/${entryId}`);
    return response.data;
  }

  async regenerateInsight(entryId: string): Promise<{
    insight: string;
    processed: boolean;
    regenerated: boolean;
    entry_id: string;
  }> {
    const response = await this.client.post(
      `/api/insights/entry/${entryId}/regenerate`
    );
    return response.data;
  }

  async getWeeklySummary(): Promise<{
    summary: string;
    entries_count: number;
    period: string;
    generated_at: string;
  }> {
    const response = await this.client.get("/api/insights/weekly");
    return response.data;
  }

  async getMoodStats(): Promise<{
    stats: {
      total_entries: number;
      average_mood: number;
      mood_distribution: Record<string, number>;
      recent_trend: string;
      period: string;
    };
  }> {
    const response = await this.client.get("/api/entries/stats");
    return response.data;
  }
}

export const apiService = new ApiService();
