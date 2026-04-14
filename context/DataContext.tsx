import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Todo, CalendarEvent, TodoStatus } from '@/lib/database.types';
import { useAuth } from './AuthContext';

interface DataContextType {
  todos: Todo[];
  events: CalendarEvent[];
  leaderboard: LeaderboardEntry[];
  isLoadingTodos: boolean;
  isLoadingEvents: boolean;
  addTodo: (todo: Omit<Todo, 'id' | 'family_id' | 'created_at' | 'completed_at'>) => Promise<string | null>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  toggleTodoStatus: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'family_id' | 'created_at'>) => Promise<string | null>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  roleLabel: string | null;
  score: number;
  todosCompleted: number;
  todosTotal: number;
  avgCompletionHours: number | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, family, familyMembers, session } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    if (session && family?.id) {
      fetchTodos(family.id);
      fetchEvents(family.id);
    } else {
      setTodos([]);
      setEvents([]);
    }
  }, [session, family?.id]);

  async function fetchTodos(familyId: string) {
    setIsLoadingTodos(true);
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });
    if (data) setTodos(data as Todo[]);
    setIsLoadingTodos(false);
  }

  async function fetchEvents(familyId: string) {
    setIsLoadingEvents(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('family_id', familyId)
      .order('event_date', { ascending: true });
    if (data) setEvents(data as CalendarEvent[]);
    setIsLoadingEvents(false);
  }

  const refresh = useCallback(async () => {
    if (family?.id) {
      await Promise.all([fetchTodos(family.id), fetchEvents(family.id)]);
    }
  }, [family?.id]);

  // Returns error message or null on success
  const addTodo = useCallback(
    async (todo: Omit<Todo, 'id' | 'family_id' | 'created_at' | 'completed_at'>): Promise<string | null> => {
      if (!family) return 'No family set';
      const { data, error } = await supabase
        .from('todos')
        .insert({
          family_id: family.id,
          title: todo.title,
          description: todo.description,
          deadline: todo.deadline,
          priority: todo.priority,
          status: todo.status,
          label: (todo as any).label || 'personal',
          location: (todo as any).location || null,
          created_by: todo.created_by,
          assigned_to: todo.assigned_to,
        })
        .select()
        .single();

      if (error) return error.message;
      if (data) setTodos((prev) => [data as Todo, ...prev]);
      return null;
    },
    [family?.id]
  );

  const updateTodo = useCallback(async (id: string, updates: Partial<Todo>) => {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (data && !error) {
      setTodos((prev) => prev.map((t) => (t.id === id ? (data as Todo) : t)));
    }
  }, []);

  const toggleTodoStatus = useCallback(async (id: string) => {
    // Use functional setState to avoid stale closure
    let original: Todo | undefined;
    let newStatus: TodoStatus;
    let updates: Partial<Todo>;

    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;
      original = todo;
      newStatus = todo.status === 'done' ? 'open' : 'done';
      updates = {
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      };
      return prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
    });

    // Sync with server
    if (original) {
      const { error } = await supabase
        .from('todos')
        .update({ status: newStatus!, completed_at: newStatus! === 'done' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) {
        // Revert on failure
        setTodos((prev) => prev.map((t) => (t.id === id ? original! : t)));
      }
    }
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    let removed: Todo | undefined;
    setTodos((prev) => {
      removed = prev.find((t) => t.id === id);
      return prev.filter((t) => t.id !== id);
    });

    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error && removed) {
      setTodos((prev) => [...prev, removed!]);
    }
  }, []);

  const addEvent = useCallback(
    async (event: Omit<CalendarEvent, 'id' | 'family_id' | 'created_at'>): Promise<string | null> => {
      if (!family) return 'No family set';
      const { data, error } = await supabase
        .from('events')
        .insert({
          family_id: family.id,
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          location: event.location,
          created_by: event.created_by,
        })
        .select()
        .single();

      if (error) return error.message;
      if (data) setEvents((prev) => [...prev, data as CalendarEvent]);
      return null;
    },
    [family?.id]
  );

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (data && !error) {
      setEvents((prev) => prev.map((e) => (e.id === id ? (data as CalendarEvent) : e)));
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    let removed: CalendarEvent | undefined;
    setEvents((prev) => {
      removed = prev.find((e) => e.id === id);
      return prev.filter((e) => e.id !== id);
    });

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error && removed) {
      setEvents((prev) => [...prev, removed!]);
    }
  }, []);

  // Compute leaderboard as useMemo, not a function call
  const leaderboard = useMemo((): LeaderboardEntry[] => {
    return familyMembers.map((member) => {
      const memberTodos = todos.filter((t) => t.assigned_to === member.id);
      const completed = memberTodos.filter((t) => t.status === 'done');

      let avgHours: number | null = null;
      const completedWithTime = completed.filter((t) => t.completed_at && t.created_at);
      if (completedWithTime.length > 0) {
        const totalHours = completedWithTime.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime();
          const finished = new Date(t.completed_at!).getTime();
          return sum + (finished - created) / 3600000;
        }, 0);
        avgHours = totalHours / completedWithTime.length;
      }

      let score = completed.length * 10;
      completed.forEach((t) => {
        if (t.deadline && t.completed_at && new Date(t.completed_at) < new Date(t.deadline)) {
          score += 5;
        }
      });

      return {
        userId: member.id,
        name: member.display_name,
        roleLabel: member.role_label,
        score,
        todosCompleted: completed.length,
        todosTotal: memberTodos.length,
        avgCompletionHours: avgHours,
      };
    }).sort((a, b) => b.score - a.score);
  }, [todos, familyMembers]);

  return (
    <DataContext.Provider
      value={{
        todos,
        events,
        leaderboard,
        isLoadingTodos,
        isLoadingEvents,
        addTodo,
        updateTodo,
        toggleTodoStatus,
        deleteTodo,
        addEvent,
        updateEvent,
        deleteEvent,
        refresh,
      }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
