import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Registrasi, Pasien, Dokter } from '../types/database';

export const useRegistrasi = () => {
  const [registrasi, setRegistrasi] = useState<Registrasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrasi = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registrasi')
        .select(`
          *,
          pasien:pasien_id (
            id,
            nama,
            nik,
            no_kartu_bpjs,
            tgl_lahir,
            jenis_kelamin
          ),
          dokter:dokter_id (
            id,
            nama,
            spesialisasi
          ),
          rumah_sakit:rumah_sakit_id (
            id,
            nama,
            alamat,
            kode_faskes
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrasi(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // NOTE: createRegistrasi is now handled by the Edge Function.
  // This client-side logic is kept for reference or potential other uses,
  // but the main form should use the new API endpoint.

  const updateRegistrasi = async (id: string, data: Partial<Registrasi>) => {
    try {
      const { data: updatedData, error } = await supabase
        .from('registrasi')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          pasien:pasien_id (
            id,
            nama,
            nik,
            no_kartu_bpjs,
            tgl_lahir,
            jenis_kelamin
          ),
          dokter:dokter_id (
            id,
            nama,
            spesialisasi
          ),
          rumah_sakit:rumah_sakit_id (
            id,
            nama,
            alamat,
            kode_faskes
          )
        `)
        .single();

      if (error) throw error;
      setRegistrasi(prev => prev.map(item => item.id === id ? updatedData : item));
      return { data: updatedData, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { data: null, error: errorMessage };
    }
  };

  const deleteRegistrasi = async (id: string) => {
    try {
      const { error } = await supabase
        .from('registrasi')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRegistrasi(prev => prev.filter(item => item.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      return { error: errorMessage };
    }
  };

  useEffect(() => {
    fetchRegistrasi();
  }, []);

  return {
    registrasi,
    loading,
    error,
    updateRegistrasi,
    deleteRegistrasi,
    refetch: fetchRegistrasi,
    addRegistrasiToList: (newReg: Registrasi) => {
      setRegistrasi(prev => [newReg, ...prev]);
    }
  };
};
