import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Pasien } from '../types/database';

export const usePasien = () => {
  const [pasien, setPasien] = useState<Pasien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPasien = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pasien')
        .select(`
          *,
          rumah_sakit:rumah_sakit_id (
            id,
            nama,
            alamat,
            kode_faskes
          )
        `)
        .order('nama');

      if (error) throw error;
      setPasien(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const createPasien = async (data: Omit<Pasien, 'id' | 'created_at' | 'rumah_sakit'>) => {
    try {
      const { data: newData, error } = await supabase
        .from('pasien')
        .insert([data])
        .select(`
          *,
          rumah_sakit:rumah_sakit_id (
            id,
            nama,
            alamat,
            kode_faskes
          )
        `)
        .single();

      if (error) throw error;
      setPasien(prev => [...prev, newData]);
      return { data: newData, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { data: null, error: errorMessage };
    }
  };

  const updatePasien = async (id: string, data: Partial<Pasien>) => {
    try {
      const { data: updatedData, error } = await supabase
        .from('pasien')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          rumah_sakit:rumah_sakit_id (
            id,
            nama,
            alamat,
            kode_faskes
          )
        `)
        .single();

      if (error) throw error;
      setPasien(prev => prev.map(item => item.id === id ? updatedData : item));
      return { data: updatedData, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { data: null, error: errorMessage };
    }
  };

  const deletePasien = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pasien')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPasien(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { error: errorMessage };
    }
  };

  useEffect(() => {
    fetchPasien();
  }, []);

  return {
    pasien,
    loading,
    error,
    createPasien,
    updatePasien,
    deletePasien,
    refetch: fetchPasien
  };
};
