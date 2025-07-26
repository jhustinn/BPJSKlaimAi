import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Dokter } from '../types/database';

export const useDokter = () => {
  const [dokter, setDokter] = useState<Dokter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDokter = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dokter')
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
      setDokter(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const createDokter = async (data: Omit<Dokter, 'id' | 'created_at' | 'rumah_sakit'>) => {
    try {
      const { data: newData, error } = await supabase
        .from('dokter')
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
      setDokter(prev => [...prev, newData]);
      return { data: newData, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { data: null, error: errorMessage };
    }
  };

  const updateDokter = async (id: string, data: Partial<Dokter>) => {
    try {
      const { data: updatedData, error } = await supabase
        .from('dokter')
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
      setDokter(prev => prev.map(item => item.id === id ? updatedData : item));
      return { data: updatedData, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { data: null, error: errorMessage };
    }
  };

  const deleteDokter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dokter')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDokter(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { error: errorMessage };
    }
  };

  useEffect(() => {
    fetchDokter();
  }, []);

  return {
    dokter,
    loading,
    error,
    createDokter,
    updateDokter,
    deleteDokter,
    refetch: fetchDokter
  };
};
