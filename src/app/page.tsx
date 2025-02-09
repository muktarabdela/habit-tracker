'use client';

import { useState, useEffect } from 'react';
import { supabase, type Habit, type HabitTrack } from '@/lib/supabase';
import Calendar from '@/components/Calendar';
import HabitForm from '@/components/HabitForm';
import HabitList from '@/components/HabitList';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { format, startOfDay } from 'date-fns';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string>();
  const [habitTracks, setHabitTracks] = useState<HabitTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    if (selectedHabitId) {
      fetchHabitTracks(selectedHabitId);
    } else {
      setHabitTracks([]);
    }
  }, [selectedHabitId]);

  // Auto-select first habit when habits are loaded
  useEffect(() => {
    if (habits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits, selectedHabitId]);

  // Get the currently selected habit
  const selectedHabit = habits.find(habit => habit.id === selectedHabitId);

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
      alert('Failed to fetch habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHabitTracks = async (habitId: string) => {
    try {
      const { data, error } = await supabase
        .from('habit_track')
        .select('*')
        .eq('habit_id', habitId);

      if (error) throw error;
      setHabitTracks(data || []);
    } catch (error) {
      console.error('Error fetching habit tracks:', error);
      alert('Failed to fetch habit tracking data. Please try again.');
    }
  };

  const handleDateClick = async (date: Date) => {
    if (!selectedHabitId) return;

    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    const existingTrack = habitTracks.find(
      track => track.date === dateStr && track.habit_id === selectedHabitId
    );

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to track habits');
      }

      if (existingTrack) {
        // Toggle the completion status
        const { error } = await supabase
          .from('habit_track')
          .update({ completed: !existingTrack.completed })
          .eq('id', existingTrack.id);

        if (error) throw error;
      } else {
        // Create a new track with user_id
        const { error } = await supabase
          .from('habit_track')
          .insert([
            {
              habit_id: selectedHabitId,
              date: dateStr,
              completed: true,
              user_id: user.id
            },
          ]);

        if (error) throw error;
      }

      // Refresh the habit tracks
      await fetchHabitTracks(selectedHabitId);
    } catch (error: any) {
      console.error('Error updating habit track:', error);
      alert(error.message || 'Failed to update habit tracking. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Updated Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-8 p-8 text-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold">Habit Tracker</h1>
              {/* You can add a profile menu or settings button here */}
            </div>

            {selectedHabit ? (
              <div className="mt-4">
                <div className="text-white/80 text-sm font-medium">Currently Tracking</div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedHabit.name}</h2>
                    {selectedHabit.description && (
                      <p className="text-white/80 mt-1">{selectedHabit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {habitTracks.filter(track => track.completed).length} days completed
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-white/80">
                {habits.length === 0 ? (
                  <p>Start by creating your first habit!</p>
                ) : (
                  <p>Select a habit to start tracking</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rest of your existing layout */}
        <div className="grid gap-8 md:grid-cols-[300px,1fr]">
          <div className="space-y-6">
            <HabitForm onHabitAdded={fetchHabits} />
            <HabitList
              habits={habits}
              selectedHabitId={selectedHabitId}
              onHabitSelect={setSelectedHabitId}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Calendar
              habitTracks={habitTracks}
              onDateClick={handleDateClick}
              selectedHabitId={selectedHabitId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
