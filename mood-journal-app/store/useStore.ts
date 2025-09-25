import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { StoreState, User, MoodEntry } from "../types/store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useStore = create<StoreState>()(
  persist((set,get)=>({
    token:null,
    user:null,
    isAuthenticated:false,

    entries:[],
    isLoading:false,
    error:null,

    setUser:(user:User,token:string)=>set({
      user,
      token,
      isAuthenticated:true,
      error :null
    }),

    logout:()=>set({
      user:null,
      token:null,
      isAuthenticated:false,
      entries:[],
      error:null
    }),

    addEntry:(entry:MoodEntry)=>set((state)=>({
      entries:[entry,...state.entries].sort(
        (a,b)=> new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
      )
    })),

    updateEntry: (entryId: string, updates: Partial<MoodEntry>) =>
      set((state) => ({
        entries: state.entries.map(entry =>
          entry.id === entryId ? { ...entry, ...updates } : entry
        )
      })),
    
    setEntries: (entries: MoodEntry[]) => 
      set({ 
        entries: entries.sort(
          (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
        )
      }),
    
    deleteEntry: (entryId: string) =>
      set((state) => ({
        entries: state.entries.filter(entry => entry.id !== entryId)
      })),

     // UI State Actions
     setLoading: (isLoading: boolean) => set({ isLoading }),
     setError: (error: string | null) => set({ error }),
     clearError: () => set({ error: null }),

  }),

{
  name:"mood-journal-store",
  storage:createJSONStorage(()=>AsyncStorage),
  partialize:(state)=>({
    token:state.token,
    user:state.user,
    isAuthenticated:state.isAuthenticated,
    entries:state.entries,
  }),
})
);
