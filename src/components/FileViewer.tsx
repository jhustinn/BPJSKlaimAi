import React from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  AlertCircle,
  X
} from 'lucide-react';
import { useRegistrasiFile } from '../hooks/useRegistrasiFile';
import { useFileUpload } from '../hooks/useFileUpload';

interface FileViewerProps {
  registrasiId: string;
  isOpen: boolean;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ registrasiId, isOpen, onClose }) => {
  const { files, loading, error, removeFile } = useRegistrasiFile(registrasiId);
  const { deleteFile, downloadFile, getFileUrl } = useFileUpload();

  if (!isOpen) return null;

  const handleDelete = async (fileId: string, filePath: string, fileName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus file "${fileName}"?`)) {
      const result = await deleteFile(fileId, filePath);
      if (result.error) {
        alert(`Gagal menghapus file: ${result.error}`);
      } else {
        removeFile(fileId);
      }
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const result = await downloadFile(filePath, fileName);
    if (result.error) {
      alert(`Gagal download file: ${result.error}`);
    }
  };

  const handleView = (filePath: string) => {
    const url = getFileUrl(filePath);
    window.open(url, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-600" />;
    } else if (fileType.includes('image')) {
      return <FileText className="w-8 h-8 text-green-600" />;
    } else {
      return <FileText className="w-8 h-8 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Dokumen SEP</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Memuat dokumen...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700">Error: {error}</p>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada dokumen yang diupload</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center mb-3">
                      {getFileIcon(file.tipe)}
                    </div>
                    
                    <div className="text-center mb-3">
                      <h3 className="font-medium text-gray-900 truncate" title={file.nama_file}>
                        {file.nama_file}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {file.created_at ? new Date(file.created_at).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                    
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleView(file.path_file)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDownload(file.path_file, file.nama_file)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(file.id, file.path_file, file.nama_file)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
