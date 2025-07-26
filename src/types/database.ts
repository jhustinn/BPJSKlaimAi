export interface RumahSakit {
  id: string;
  nama: string;
  alamat?: string;
  kode_faskes?: string;
  created_at?: string;
}

export interface Pasien {
  id: string;
  rumah_sakit_id: string;
  nama: string;
  nik?: string;
  no_kartu_bpjs?: string;
  tgl_lahir?: string;
  jenis_kelamin?: string;
  created_at?: string;
  rumah_sakit?: RumahSakit;
}

export interface Dokter {
  id: string;
  rumah_sakit_id: string;
  user_id?: string;
  nama: string;
  spesialisasi?: string;
  created_at?: string;
  rumah_sakit?: RumahSakit;
}

export interface Profile {
  user_id: string;
  nama: string;
  role: string;
  rumah_sakit_id?: string;
  updated_at?: string;
}

export interface Registrasi {
  id: string;
  rumah_sakit_id: string;
  pasien_id: string;
  dokter_id: string;
  tanggal_kunjungan: string;
  jenis_pelayanan?: string;
  status_kirim?: string;
  status_audit?: string;
  file_merge?: string;
  created_at?: string;
  pasien?: Pasien;
  dokter?: Dokter;
  rumah_sakit?: RumahSakit;
}

export interface RegistrasiFile {
  id: string;
  registrasi_id: string;
  path_file: string;
  file_name?: string;
  file_type?: string;
  created_at?: string;
}
