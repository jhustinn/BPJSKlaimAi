import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { decode } from 'https://deno.land/std@0.203.0/encoding/base64.ts';

interface Pasien { id: string; rumah_sakit_id: string; nama: string; }
interface Dokter { id: string; rumah_sakit_id: string; nama: string; }

const findOrCreatePasien = async (supabaseAdmin: any, namaPasien: string, rumahSakitId: string): Promise<Pasien> => {
  const { data: existingPasien, error: searchError } = await supabaseAdmin
    .from('pasien')
    .select('id, nama, rumah_sakit_id')
    .eq('nama', namaPasien)
    .eq('rumah_sakit_id', rumahSakitId)
    .single();
  if (searchError && searchError.code !== 'PGRST116') throw searchError;
  if (existingPasien) return existingPasien;
  const { data: newPasien, error: insertError } = await supabaseAdmin
    .from('pasien')
    .insert([{ nama: namaPasien, rumah_sakit_id: rumahSakitId }])
    .select('id, nama, rumah_sakit_id')
    .single();
  if (insertError) throw insertError;
  return newPasien;
};

const findOrCreateDokter = async (supabaseAdmin: any, namaDokter: string, rumahSakitId: string): Promise<Dokter> => {
  const { data: existingDokter, error: searchError } = await supabaseAdmin
    .from('dokter')
    .select('id, nama, rumah_sakit_id')
    .eq('nama', namaDokter)
    .eq('rumah_sakit_id', rumahSakitId)
    .single();
  if (searchError && searchError.code !== 'PGRST116') throw searchError;
  if (existingDokter) return existingDokter;
  const { data: newDokter, error: insertError } = await supabaseAdmin
    .from('dokter')
    .insert([{ nama: namaDokter, rumah_sakit_id: rumahSakitId }])
    .select('id, nama, rumah_sakit_id')
    .single();
  if (insertError) throw insertError;
  return newDokter;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { auth, data: sepData, files } = body;

    if (!auth || !auth.email || !auth.password) {
      return new Response(JSON.stringify({ error: 'Kredensial autentikasi tidak ditemukan.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sign in to get session
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: signInData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: auth.email,
      password: auth.password,
    });

    if (authError || !signInData?.user) {
      return new Response(JSON.stringify({ error: 'Autentikasi gagal.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Ambil rumah_sakit_id dari profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('rumah_sakit_id')
      .eq('id', signInData.user.id)
      .single();

    if (profileError || !profileData) {
      return new Response(JSON.stringify({ error: 'Tidak dapat mengambil rumah_sakit_id dari profile.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rumah_sakit_id = profileData.rumah_sakit_id;
    const { nama_pasien, nama_dokter, tanggal_kunjungan, jenis_pelayanan } = sepData;

    if (!nama_pasien || !nama_dokter || !tanggal_kunjungan) {
      return new Response(JSON.stringify({ error: 'Data tidak lengkap' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pasien & Dokter
    const pasien = await findOrCreatePasien(supabaseAdmin, nama_pasien, rumah_sakit_id);
    const dokter = await findOrCreateDokter(supabaseAdmin, nama_dokter, rumah_sakit_id);

    // Registrasi
    const { data: newRegistrasi, error: registrasiError } = await supabaseAdmin
      .from('registrasi')
      .insert({
        rumah_sakit_id: rumah_sakit_id,
        pasien_id: pasien.id,
        dokter_id: dokter.id,
        tanggal_kunjungan: tanggal_kunjungan,
        jenis_pelayanan: jenis_pelayanan || null,
        status_kirim: 'menunggu',
        status_audit: 'menunggu',
      })
      .select()
      .single();

    if (registrasiError) throw registrasiError;

    // Upload files
    const uploadedFiles = [];
    if (files && Array.isArray(files)) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${newRegistrasi.id}_${Date.now()}.${fileExt}`;
        const filePath = `registrasi/${newRegistrasi.id}/${fileName}`;
        const fileContent = decode(file.content);

        const { error: uploadError } = await supabaseAdmin.storage
          .from('sep-documents')
          .upload(filePath, fileContent, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`Gagal upload file ${file.name}:`, uploadError);
          continue;
        }

        const { data: fileRecord, error: dbError } = await supabaseAdmin
          .from('registrasi_file')
          .insert({
            registrasi_id: newRegistrasi.id,
            nama_file: file.name,
            path_file: filePath,
            tipe: file.type,
          })
          .select()
          .single();

        if (dbError) {
          console.error(`Gagal menyimpan info file ${file.name}:`, dbError);
          await supabaseAdmin.storage.from('sep-documents').remove([filePath]);
          continue;
        }

        uploadedFiles.push(fileRecord);
      }
    }

    return new Response(JSON.stringify({
      message: 'Registrasi SEP berhasil dibuat.',
      registrasi: newRegistrasi,
      files: uploadedFiles
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
