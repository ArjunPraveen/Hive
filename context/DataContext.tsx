import React, { createContext, useContext, useState, useCallback } from 'react';
import { Todo, CalendarEvent, TodoStatus } from '@/lib/database.types';
import { useAuth } from './AuthContext';

// Mock todos
const INITIAL_TODOS: Todo[] = [
  {
    id: 'todo-1',
    family_id: 'family-1',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, vegetables',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    priority: 1,
    status: 'open',
    created_by: 'user-1',
    assigned_to: 'user-2',
    completed_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'todo-2',
    family_id: 'family-1',
    title: 'Fix kitchen tap',
    description: 'The tap has been leaking for a while',
    deadline: new Date(Date.now() + 172800000).toISOString(),
    priority: 0,
    status: 'in_progress',
    created_by: 'user-2',
    assigned_to: 'user-1',
    completed_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'todo-3',
    family_id: 'family-1',
    title: 'Complete math homework',
    description: 'Chapter 5 exercises',
    deadline: new Date(Date.now() + 43200000).toISOString(),
    priority: 1,
    status: 'open',
    created_by: 'user-1',
    assigned_to: 'user-3',
    completed_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'todo-4',
    family_id: 'family-1',
    title: 'Book dentist appointment',
    description: 'For Riya - routine checkup',
    deadline: new Date(Date.now() + 604800000).toISOString(),
    priority: 2,
    status: 'open',
    created_by: 'user-2',
    assigned_to: 'user-2',
    completed_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'todo-5',
    family_id: 'family-1',
    title: 'Clean the garage',
    description: null,
    deadline: null,
    priority: 3,
    status: 'done',
    created_by: 'user-1',
    assigned_to: 'user-1',
    completed_at: new Date(Date.now() - 43200000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'event-1',
    family_id: 'family-1',
    title: "Riya's School Play",
    description: 'Annual day performance at school auditorium',
    event_date: new Date(Date.now() + 259200000).toISOString(),
    location: 'School Auditorium',
    created_by: 'user-2',
    created_at: new Date().toISOString(),
  },
  {
    id: 'event-2',
    family_id: 'family-1',
    title: 'Family Dinner',
    description: "Grandma's birthday celebration",
    event_date: new Date(Date.now() + 604800000).toISOString(),
    location: 'Home',
    created_by: 'user-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'event-3',
    family_id: 'family-1',
    title: 'Doctor Appointment',
    description: 'Annual checkup',
    event_date: new Date(Date.now() + 432000000).toISOString(),
    location: 'City Hospital',
    created_by: 'user-2',
    created_at: new Date().toISOString(),
  },
];

interface DataContextType {
  todos: Todo[];
  events: CalendarEvent[];
  addTodo: (todo: Omit<Todo, 'id' | 'family_id' | 'created_at' | 'completed_at'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  toggleTodoStatus: (id: string) => void;
  deleteTodo: (id: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'family_id' | 'created_at'>) => void;
  deleteEvent: (id: string) => void;
  getLeaderboard: () => LeaderboardEntry[];
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
  const { user, familyMembers } = useAuth();
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);

  const addTodo = useCallback(
    (todo: Omit<Todo, 'id' | 'family_id' | 'created_at' | 'completed_at'>) => {
      const newTodo: Todo = {
        ...todo,
        id: `todo-${Date.now()}`,
        family_id: user?.family_id || 'family-1',
        created_at: new Date().toISOString(),
        completed_at: null,
      };
      setTodos((prev) => [newTodo, ...prev]);
    },
    [user]
  );

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const toggleTodoStatus = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (t.status === 'done') {
          return { ...t, status: 'open' as TodoStatus, completed_at: null };
        }
        return { ...t, status: 'done' as TodoStatus, completed_at: new Date().toISOString() };
      })
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, 'id' | 'family_id' | 'created_at'>) => {
      const newEvent: CalendarEvent = {
        ...event,
        id: `event-${Date.now()}`,
        family_id: user?.family_id || 'family-1',
        created_at: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, newEvent]);
    },
    [user]
  );

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getLeaderboard = useCallback((): LeaderboardEntry[] => {
    return familyMembers.map((member) => {
      const memberTodos = todos.filter((t) => t.assigned_to === member.id);
      const completed = memberTodos.filter((t) => t.status === 'done');

      // Calculate avg completion time in hours
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

      // Score: 10 pts per completion, speed bonus if completed before deadline
      let score = completed.length * 10;
      completed.forEach((t) => {
        if (t.deadline && t.completed_at && new Date(t.completed_at) < new Date(t.deadline)) {
          score += 5; // Early completion bonus
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
        addTodo,
        updateTodo,
        toggleTodoStatus,
        deleteTodo,
        addEvent,
        deleteEvent,
        getLeaderboard,
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
