import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UploadedFile {
  id: string;
  registrasi_id: string;
  nama_file: string;
  path_file: string;
  tipe: string;
  created_at?: string;
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFiles = async (files: File[], registrasiId: string): Promise<{ data: UploadedFile[] | null, error: string | null }> => {
    if (!files.length) {
      return { data: [], error: null };
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles: UploadedFile[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${registrasiId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `registrasi/${registrasiId}/${fileName}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('sep-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Gagal upload file ${file.name}: ${uploadError.message}`);
        }

        // Save file info to database
        const { data: fileRecord, error: dbError } = await supabase
          .from('registrasi_file')
          .insert([{
            registrasi_id: registrasiId,
            nama_file: file.name,
            path_file: uploadData.path,
            tipe: file.type || 'application/octet-stream'
          }])
          .select()
          .single();

        if (dbError) {
          // If database insert fails, delete the uploaded file
          await supabase.storage
            .from('sep-documents')
            .remove([uploadData.path]);
          
          throw new Error(`Gagal menyimpan info file ${file.name}: ${dbError.message}`);
        }

        uploadedFiles.push(fileRecord);
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      return { data: uploadedFiles, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat upload file';
      return { data: null, error: errorMessage };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (fileId: string, filePath: string): Promise<{ error: string | null }> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('sep-documents')
        .remove([filePath]);

      if (storageError) {
        throw new Error(`Gagal menghapus file dari storage: ${storageError.message}`);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('registrasi_file')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw new Error(`Gagal menghapus record file: ${dbError.message}`);
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus file';
      return { error: errorMessage };
    }
  };

  const getFileUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from('sep-documents')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const downloadFile = async (filePath: string, fileName: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.storage
        .from('sep-documents')
        .download(filePath);

      if (error) {
        throw new Error(`Gagal download file: ${error.message}`);
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat download file';
      return { error: errorMessage };
    }
  };

  return {
    uploadFiles,
    deleteFile,
    getFileUrl,
    downloadFile,
    uploading,
    uploadProgress
  };
};
