/*
  # Create SEP API Endpoint

  1. New Edge Function
    - `create-sep` endpoint for external SEP creation
    - POST method with JSON body and file upload support
    - Authentication using email/password
    - Automatic hospital ID retrieval from user profile

  2. Features
    - Email/password authentication
    - File upload support (multipart/form-data)
    - Automatic patient/doctor creation if not exists
    - SEP registration creation
    - File storage in Supabase Storage

  3. Security
    - Authentication required
    - Hospital-specific data isolation
    - Input validation
*/

import { createClient } from 'npm:@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSEPRequest {
  email: string
  password: string
  nama_pasien: string
  nama_dokter: string
  tanggal_kunjungan: string
  jenis_pelayanan?: string
  nik?: string
  no_kartu_bpjs?: string
  tgl_lahir?: string
  jenis_kelamin?: string
  spesialisasi_dokter?: string
}

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      })
    }

    // Only allow POST method for creating SEP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST method.' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = "https://vclfbrlzttksibqviumu.supabase.co";
    const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGZicmx6dHRrc2licXZpdW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjY5NzgsImV4cCI6MjA2ODk0Mjk3OH0.r7ygcreotQrvGJ6Wp_LJEFsTJ8czw1HEprGe4DY83p0";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let requestData: CreateSEPRequest
    let files: File[] = []

    // Parse request based on content type
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data (with files)
      const formData = await req.formData()
      
      // Extract JSON data
      const jsonData = formData.get('data') as string
      if (!jsonData) {
        return new Response(
          JSON.stringify({ error: 'Missing data field in form' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      try {
        requestData = JSON.parse(jsonData)
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in data field' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Extract files
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('file') && value instanceof File) {
          files.push(value)
        }
      }
    } else if (contentType.includes('application/json')) {
      // Handle JSON only
      try {
        requestData = await req.json()
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported content type. Use application/json or multipart/form-data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate required fields
    const requiredFields = ['email', 'password', 'nama_pasien', 'nama_dokter', 'tanggal_kunjungan']
    for (const field of requiredFields) {
      if (!requestData[field as keyof CreateSEPRequest]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: requestData.email,
      password: requestData.password,
    })

    if (authError || !authData.user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user profile to retrieve hospital ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rumah_sakit_id')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError || !profile?.rumah_sakit_id) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: `${authData.user.id}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const rumahSakitId = profile.rumah_sakit_id

    // Find or create patient
    let { data: existingPasien, error: pasienSearchError } = await supabase
      .from('pasien')
      .select('*')
      .eq('nama', requestData.nama_pasien)
      .eq('rumah_sakit_id', rumahSakitId)
      .single()

    if (pasienSearchError && pasienSearchError.code !== 'PGRST116') {
      console.error('Patient search error:', pasienSearchError)
      throw pasienSearchError
    }

    let pasienId: string

    if (existingPasien) {
      pasienId = existingPasien.id
    } else {
      // Create new patient
      const { data: newPasien, error: createPasienError } = await supabase
        .from('pasien')
        .insert([{
          nama: requestData.nama_pasien,
          rumah_sakit_id: rumahSakitId,
          nik: requestData.nik || null,
          no_kartu_bpjs: requestData.no_kartu_bpjs || null,
          tgl_lahir: requestData.tgl_lahir || null,
          jenis_kelamin: requestData.jenis_kelamin || null,
        }])
        .select()
        .single()

      if (createPasienError) {
        console.error('Create patient error:', createPasienError)
        throw createPasienError
      }

      pasienId = newPasien.id
    }

    // Find or create doctor
    let { data: existingDokter, error: dokterSearchError } = await supabase
      .from('dokter')
      .select('*')
      .eq('nama', requestData.nama_dokter)
      .eq('rumah_sakit_id', rumahSakitId)
      .single()

    if (dokterSearchError && dokterSearchError.code !== 'PGRST116') {
      console.error('Doctor search error:', dokterSearchError)
      throw dokterSearchError
    }

    let dokterId: string

    if (existingDokter) {
      dokterId = existingDokter.id
    } else {
      // Create new doctor
      const { data: newDokter, error: createDokterError } = await supabase
        .from('dokter')
        .insert([{
          nama: requestData.nama_dokter,
          rumah_sakit_id: rumahSakitId,
          spesialisasi: requestData.spesialisasi_dokter || null,
        }])
        .select()
        .single()

      if (createDokterError) {
        console.error('Create doctor error:', createDokterError)
        throw createDokterError
      }

      dokterId = newDokter.id
    }

    // Create registration
    const { data: registrasi, error: registrasiError } = await supabase
      .from('registrasi')
      .insert([{
        rumah_sakit_id: rumahSakitId,
        pasien_id: pasienId,
        dokter_id: dokterId,
        tanggal_kunjungan: requestData.tanggal_kunjungan,
        jenis_pelayanan: requestData.jenis_pelayanan || null,
        status_kirim: 'menunggu',
        status_audit: 'menunggu',
      }])
      .select()
      .single()

    if (registrasiError) {
      console.error('Registration error:', registrasiError)
      throw registrasiError
    }

    // Upload files if any
    const uploadedFiles: string[] = []
    
    if (files.length > 0) {
      // Ensure documents bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const documentsBucket = buckets?.find(bucket => bucket.name === 'documents')
      
      if (!documentsBucket) {
        const { error: bucketError } = await supabase.storage.createBucket('documents', {
          public: false,
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
          fileSizeLimit: 10485760 // 10MB
        })
        
        if (bucketError) {
          console.error('Bucket creation error:', bucketError)
        }
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
          console.warn(`Skipping file ${file.name} - unsupported type: ${file.type}`)
          continue
        }

        // Validate file size (10MB max)
        if (file.size > 10485760) {
          console.warn(`Skipping file ${file.name} - too large: ${file.size} bytes`)
          continue
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${registrasi.id}_${i + 1}.${fileExt}`
        const filePath = `sep-documents/${rumahSakitId}/${fileName}`

        // Convert file to ArrayBuffer for upload
        const fileBuffer = await file.arrayBuffer()

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('File upload error:', uploadError)
          // Continue with other files even if one fails
          continue
        }

        // Save file record to database
        const { error: fileRecordError } = await supabase
          .from('registrasi_file')
          .insert([{
            registrasi_id: registrasi.id,
            nama_file: file.name,
            path_file: filePath,
            tipe: 'dokumen_sep',
          }])

        if (!fileRecordError) {
          uploadedFiles.push(fileName)
        } else {
          console.error('File record error:', fileRecordError)
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'SEP berhasil dibuat',
        data: {
          registrasi_id: registrasi.id,
          pasien_id: pasienId,
          dokter_id: dokterId,
          rumah_sakit_id: rumahSakitId,
          tanggal_kunjungan: requestData.tanggal_kunjungan,
          jenis_pelayanan: requestData.jenis_pelayanan,
          status_kirim: 'menunggu',
          uploaded_files: uploadedFiles,
          total_files: files.length,
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error creating SEP:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'Terjadi kesalahan saat membuat SEP'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})