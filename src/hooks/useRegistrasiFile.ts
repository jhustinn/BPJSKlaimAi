import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UploadedFile } from './useFileUpload';

export const useRegistrasiFile = (registrasiId?: string) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (regId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registrasi_file')
        .select('*')
        .eq('registrasi_id', regId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const addFiles = (newFiles: UploadedFile[]) => {
    setFiles(prev => [...newFiles, ...prev]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  useEffect(() => {
    if (registrasiId) {
      fetchFiles(registrasiId);
    }
  }, [registrasiId]);

  return {
    files,
    loading,
    error,
    fetchFiles,
    addFiles,
    removeFile,
    refetch: () => registrasiId && fetchFiles(registrasiId)
  };
};
