import React, { useState } from 'react';
import { 
  Filter, 
  Plus, 
  Edit, 
  Search, 
  Upload,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertCircle,
  Download
} from 'lucide-react';
import { useRegistrasi } from '../hooks/useRegistrasi';
import { useRumahSakit } from '../hooks/useRumahSakit';
import { useFileUpload } from '../hooks/useFileUpload';
import FileViewer from './FileViewer';
import { supabase } from '../lib/supabase';
import { PDFDocument } from 'pdf-lib';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const DataSEP: React.FC = () => {
  const { registrasi, loading, error, createRegistrasi } = useRegistrasi();
  const { rumahSakit } = useRumahSakit();
  const { uploadFiles, uploading, uploadProgress } = useFileUpload();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegistrasiId, setSelectedRegistrasiId] = useState<string | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [formData, setFormData] = useState({
    rumah_sakit_id: '',
    nama_pasien: '',
    nama_dokter: '',
    tanggal_kunjungan: '',
    jenis_pelayanan: '',
    dokumen: [] as File[]
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mergingId, setMergingId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      terkirim: 'bg-green-100 text-green-800 border-green-200',
      menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ditolak: 'bg-red-100 text-red-800 border-red-200'
    };

    const statusText = {
      terkirim: 'Terkirim',
      menunggu: 'Menunggu', 
      ditolak: 'Ditolak'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig[status as keyof typeof statusConfig]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  const handleViewFiles = (registrasiId: string) => {
    setSelectedRegistrasiId(registrasiId);
    setShowFileViewer(true);
  };

  const filteredData = registrasi.filter(item =>
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.pasien?.nama && item.pasien.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.dokter?.nama && item.dokter.nama.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitSEP();
  };

  const handleSubmitSEP = async () => {
    setIsSubmitting(true);
    setFormError('');

    // Validasi form
    if (!formData.rumah_sakit_id) {
      setFormError('Rumah sakit harus dipilih');
      setIsSubmitting(false);
      return;
    }

    if (!formData.nama_pasien.trim()) {
      setFormError('Nama pasien harus diisi');
      setIsSubmitting(false);
      return;
    }

    if (!formData.nama_dokter.trim()) {
      setFormError('Nama dokter harus diisi');
      setIsSubmitting(false);
      return;
    }

    if (!formData.tanggal_kunjungan) {
      setFormError('Tanggal kunjungan harus diisi');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createRegistrasi({
        rumah_sakit_id: formData.rumah_sakit_id,
        nama_pasien: formData.nama_pasien.trim(),
        nama_dokter: formData.nama_dokter.trim(),
        tanggal_kunjungan: formData.tanggal_kunjungan,
        jenis_pelayanan: formData.jenis_pelayanan.trim() || undefined
      });

      if (result.error) {
        setFormError(result.error);
      } else {
        // Upload files if any
        if (formData.dokumen.length > 0 && result.data) {
          const uploadResult = await uploadFiles(formData.dokumen, result.data.id);
          if (uploadResult.error) {
            console.warn('Gagal upload beberapa file:', uploadResult.error);
            // SEP tetap berhasil dibuat, hanya file yang gagal
            alert(`SEP berhasil ditambahkan! Namun ada masalah dengan upload file: ${uploadResult.error}`);
          } else {
            alert('SEP dan dokumen berhasil ditambahkan!');
          }
        } else {
          alert('SEP berhasil ditambahkan!');
        }
        handleCloseModal();
      }
    } catch (err) {
      setFormError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setFormData({
      rumah_sakit_id: '',
      nama_pasien: '',
      nama_dokter: '',
      tanggal_kunjungan: '',
      jenis_pelayanan: '',
      dokumen: []
    });
    setFormError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({ 
        ...prev, 
        dokumen: [...prev.dokumen, ...newFiles]
      }));
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      dokumen: prev.dokumen.filter((_, index) => index !== indexToRemove)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleMergeAndDownload = async (registrasiId: string, pasienNama: string) => {
    setMergingId(registrasiId);
    try {
      // 1. Get all file paths for the specific registration
      const { data: filesData, error: filesError } = await supabase
        .from('registrasi_file')
        .select('path_file')
        .eq('registrasi_id', registrasiId);

      if (filesError) throw filesError;
      if (!filesData || filesData.length === 0) {
        alert('Tidak ada dokumen yang ditemukan untuk registrasi ini.');
        return;
      }

      // 2. Fetch all files from storage
      const filePromises = filesData.map(async (file) => {
        const { data, error } = await supabase.storage
          .from('sep-documents')
          .download(file.path_file);
        if (error) throw new Error(`Gagal download file: ${file.path_file}`);
        return { blob: data, path: file.path_file };
      });

      const downloadedFiles = await Promise.all(filePromises);

      // 3. Merge files into a single PDF
      const mergedPdf = await PDFDocument.create();

      for (const file of downloadedFiles) {
        if (!file.blob) continue;
        const buffer = await file.blob.arrayBuffer();
        const fileExt = file.path.split('.').pop()?.toLowerCase();

        if (fileExt === 'pdf') {
          const pdfDoc = await PDFDocument.load(buffer);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach(page => mergedPdf.addPage(page));
        } else if (fileExt === 'jpg' || fileExt === 'jpeg') {
          const image = await mergedPdf.embedJpg(buffer);
          const page = mergedPdf.addPage();
          const { width, height } = image.scaleToFit(page.getWidth(), page.getHeight());
          page.drawImage(image, {
            x: page.getWidth() / 2 - width / 2,
            y: page.getHeight() / 2 - height / 2,
            width,
            height,
          });
        } else if (fileExt === 'png') {
          const image = await mergedPdf.embedPng(buffer);
          const page = mergedPdf.addPage();
          const { width, height } = image.scaleToFit(page.getWidth(), page.getHeight());
          page.drawImage(image, {
            x: page.getWidth() / 2 - width / 2,
            y: page.getHeight() / 2 - height / 2,
            width,
            height,
          });
        } else {
          console.warn(`Unsupported file type skipped: ${file.path}`);
        }
      }

      // 4. Trigger download
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safePasienNama = pasienNama.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `dokumen_sep_${safePasienNama}_${registrasiId.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      console.error('Error merging PDF:', err);
      alert(`Terjadi kesalahan saat menggabungkan PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setMergingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-4">
        <span>Beranda</span> <span className="mx-2">{'>'}</span> <span className="text-blue-600 font-medium">Data SEP</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Data SEP</h1>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah SEP</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        {/* Table Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">Daftar SEP</h2>
              <span className="text-sm text-gray-500">Total: {filteredData.length}</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari SEP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Registrasi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Pasien</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Kunjungan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dokter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poli/Layanan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rumah Sakit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dokumen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.pasien?.nama || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.tanggal_kunjungan ? new Date(item.tanggal_kunjungan).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.dokter?.nama || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.jenis_pelayanan || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.rumah_sakit?.nama || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(item.status_kirim || 'menunggu')}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewFiles(item.id)}
                      className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4 inline mr-1" />
                      Lihat
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleMergeAndDownload(item.id, item.pasien?.nama || 'pasien')}
                        disabled={!!mergingId}
                        className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download Dokumen Tergabung"
                      >
                        {mergingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                      <button className="text-blue-600 hover:text-blue-800 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} SEP
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form Data SEP */}
      <Modal 
        isOpen={showForm} 
        onClose={handleCloseModal}
        title="Form Data SEP"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rumah Sakit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rumah Sakit <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.rumah_sakit_id}
                onChange={(e) => setFormData(prev => ({ ...prev, rumah_sakit_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Pilih rumah sakit...</option>
                {rumahSakit.map(rs => (
                  <option key={rs.id} value={rs.id}>{rs.nama}</option>
                ))}
              </select>
            </div>

            {/* Nama Pasien */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pasien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nama_pasien}
                onChange={(e) => setFormData(prev => ({ ...prev, nama_pasien: e.target.value }))}
                placeholder="Masukkan nama pasien"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Jika pasien belum ada, akan otomatis ditambahkan ke database</p>
            </div>

            {/* Nama Dokter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Dokter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nama_dokter}
                onChange={(e) => setFormData(prev => ({ ...prev, nama_dokter: e.target.value }))}
                placeholder="Masukkan nama dokter"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Jika dokter belum ada, akan otomatis ditambahkan ke database</p>
            </div>

            {/* Tanggal Kunjungan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Kunjungan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.tanggal_kunjungan}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal_kunjungan: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Jenis Pelayanan */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Pelayanan</label>
              <input
                type="text"
                value={formData.jenis_pelayanan}
                onChange={(e) => setFormData(prev => ({ ...prev, jenis_pelayanan: e.target.value }))}
                placeholder="Contoh: Rawat Jalan, Rawat Inap, IGD"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Upload Dokumen SEP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Dokumen SEP</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors mb-4">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-2">Klik untuk upload atau drag &amp; drop file</p>
              <p className="text-xs text-gray-400 mb-2">Mendukung format: PDF, JPG, JPEG, PNG (Max 10MB per file)</p>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                Pilih file (dapat memilih lebih dari 1)
              </label>
            </div>
            
            {/* File List */}
            {formData.dokumen.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">File terpilih ({formData.dokumen.length}):</p>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {formData.dokumen.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || uploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {uploading ? `Mengupload file... ${uploadProgress}%` : 'Menyimpan...'}
                  </span>
                </div>
              ) : (
                'Simpan SEP'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* File Viewer Modal */}
      {selectedRegistrasiId && (
        <FileViewer
          registrasiId={selectedRegistrasiId}
          isOpen={showFileViewer}
          onClose={() => {
            setShowFileViewer(false);
            setSelectedRegistrasiId(null);
          }}
        />
      )}
    </div>
  );
};

export default DataSEP;
