export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          family_id: string | null;
          display_name: string;
          avatar_url: string | null;
          role_label: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          family_id?: string | null;
          display_name: string;
          avatar_url?: string | null;
          role_label?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          role_label?: string | null;
          phone?: string | null;
          created_at?: string;
        };
      };
      todos: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          description: string | null;
          deadline: string | null;
          priority: number;
          status: 'open' | 'in_progress' | 'done';
          label: 'personal' | 'work';
          location: string | null;
          created_by: string;
          assigned_to: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          description?: string | null;
          deadline?: string | null;
          priority?: number;
          status?: 'open' | 'in_progress' | 'done';
          label?: 'personal' | 'work';
          location?: string | null;
          created_by: string;
          assigned_to: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          description?: string | null;
          deadline?: string | null;
          priority?: number;
          status?: 'open' | 'in_progress' | 'done';
          label?: 'personal' | 'work';
          location?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          description: string | null;
          event_date: string;
          location: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          location?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          location?: string | null;
          created_at?: string;
        };
      };
      habits: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          category: string;
          frequency_type: 'daily' | 'weekly' | 'custom';
          frequency_count: number;
          custom_days: number[] | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          category?: string;
          frequency_type: 'daily' | 'weekly' | 'custom';
          frequency_count?: number;
          custom_days?: number[] | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          frequency_type?: 'daily' | 'weekly' | 'custom';
          frequency_count?: number;
          custom_days?: number[] | null;
        };
      };
      habit_assignees: {
        Row: {
          habit_id: string;
          user_id: string;
        };
        Insert: {
          habit_id: string;
          user_id: string;
        };
        Update: {
          habit_id?: string;
          user_id?: string;
        };
      };
      habit_checkins: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          checked_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          checked_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          checked_date?: string;
        };
      };
    };
  };
}

// Convenience types
export type Family = Database['public']['Tables']['families']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Todo = Database['public']['Tables']['todos']['Row'];
export type CalendarEvent = Database['public']['Tables']['events']['Row'];
export type Habit = Database['public']['Tables']['habits']['Row'];
export type HabitAssignee = Database['public']['Tables']['habit_assignees']['Row'];
export type HabitCheckin = Database['public']['Tables']['habit_checkins']['Row'];

export type TodoStatus = 'open' | 'in_progress' | 'done';
export type Priority = 0 | 1 | 2 | 3;
export type FrequencyType = 'daily' | 'weekly' | 'custom';
