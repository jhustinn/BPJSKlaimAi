import { supabase } from './supabase';

// Helper function to convert a File object to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Result is a data URL (e.g., "data:image/png;base64,iVBORw0KGgo..."), we only need the Base64 part.
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface SepData {
  rumah_sakit_id: string;
  nama_pasien: string;
  nama_dokter: string;
  tanggal_kunjungan: string;
  jenis_pelayanan?: string;
}

export const createSepWithFiles = async (
  sepData: SepData,
  files: File[]
): Promise<{ data: any; error: string | null }> => {
  try {
    // This function assumes the user is already logged in on the client-side.
    // The Edge Function will perform its own auth check with credentials.
    // For a real-world app, you'd securely get credentials or use the session.
    // Here, we'll use placeholder credentials as required by the function signature.
    const auth = {
      email: "admin@dextra.com", // This should be dynamically and securely handled
      password: "admin123"       // This should be dynamically and securely handled
    };

    const filesPayload = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        content: await fileToBase64(file),
      }))
    );

    const requestBody = {
      auth,
      data: sepData,
      files: filesPayload,
    };

    // The Supabase client automatically adds the Authorization header with the anon key.
    const { data, error } = await supabase.functions.invoke('tambah-sep', {
      body: JSON.stringify(requestBody), // Body must be stringified for JSON
    });

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memanggil API';
    console.error(errorMessage);
    return { data: null, error: errorMessage };
  }
};
