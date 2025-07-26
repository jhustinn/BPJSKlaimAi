import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RumahSakit } from '../types/database';

export const useRumahSakit = () => {
  const [rumahSakit, setRumahSakit] = useState<RumahSakit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRumahSakit = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rumah_sakit')
        .select('*')
        .order('nama');

      if (error) throw error;
      setRumahSakit(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const createRumahSakit = async (data: Omit<RumahSakit, 'id' | 'created_at'>) => {
    try {
      const { data: newData, error } = await supabase
        .from('rumah_sakit')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      setRumahSakit(prev => [...prev, newData]);
      return { data: newData, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { data: null, error: errorMessage };
    }
  };

  const updateRumahSakit = async (id: string, data: Partial<RumahSakit>) => {
    try {
      const { data: updatedData, error } = await supabase
        .from('rumah_sakit')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setRumahSakit(prev => prev.map(item => item.id === id ? updatedData : item));
      return { data: updatedData, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { data: null, error: errorMessage };
    }
  };

  const deleteRumahSakit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rumah_sakit')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRumahSakit(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { error: errorMessage };
    }
  };

  useEffect(() => {
    fetchRumahSakit();
  }, []);

  return {
    rumahSakit,
    loading,
    error,
    createRumahSakit,
    updateRumahSakit,
    deleteRumahSakit,
    refetch: fetchRumahSakit
  };
};
