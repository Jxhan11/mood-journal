export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: number;
  last_login?: number;
}

export interface AudioFile {
  filename: string;
  original_filename: string;
  file_size: number;
  duration?: number;
  content_type: string;
  upload_timestamp: string;
  url: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: {
    emoji: string;
    emotion: string; // 'happy', 'sad', 'neutral', 'angry', 'anxious'
  };
  text_note?: string;
  audio_file?: AudioFile;
  ai_insight?: string;
  ai_processed: boolean;
  ai_processing_failed: boolean;
  ai_error_message?: string;
  ai_processed_at?: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  local_id?: string;
  synced: boolean;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user: User;
  expires_in: number;
}

export interface ApiError {
  error: string;
  message: string;
  code?: number;
  details?: any;
}

export interface StoreState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  entries: MoodEntry[];
  isLoading: boolean;
  error: string | null;

  //actions
  setUser: (user: User, token: string) => void;
  logout: () => void;

  //Entry actions
  addEntry: (entry: MoodEntry) => void;
  updateEntry: (entryId: string, updates: Partial<MoodEntry>) => void;
  setEntries: (entries: MoodEntry[]) => void;
  deleteEntry: (entry_id: string) => void;

  //UI State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
