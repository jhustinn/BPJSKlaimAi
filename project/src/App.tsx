import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Upload, Send, FileText, Bot, Loader, CheckCircle, AlertCircle, Sparkles, Shield } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set PDF.js worker using CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// Initialize Gemini AI with environment variable or placeholder
const genAI = new GoogleGenerativeAI("AIzaSyCf2JY45MzNK6K8UZiRKqjIWBdVp3LzsGQ");

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface PDFContent {
  text: string;
  numPages: number;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfContent, setPdfContent] = useState<PDFContent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files && files[0]) {
      setFile(files[0]);
      setMessages([]);
      setPdfContent(null);
      setExtractedText('');
    }
  }, []);

const onDocumentLoadSuccess = useCallback(async (pdfDocument: PDFDocumentProxy) => {
  const numPages = pdfDocument.numPages;
  setNumPages(numPages);
  setIsAnalyzing(true);

  try {
    let fullText = '';
    const perPageText: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
      perPageText.push(pageText);
    }

    setExtractedText(fullText);
    setPdfContent({ text: fullText, numPages });

    // Kirim ke Gemini untuk menganalisis per halaman
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

   const prompt = `
Kamu adalah asisten AI untuk memverifikasi dokumen klaim BPJS. Berikut ini adalah 5 dokumen yang WAJIB ADA:

1. SURAT RUJUKAN FKTP
2. SEP (SURAT ELEGIBILITAS PESERTA)
3. KARTU BPJS
4. KARTU KTP
5. RESUME MEDIS

(OPSIONAL)
6. LABORATORIUM
7. RADIOLOGI

Cocokkan daftar di atas dengan daftar nama dokumen yang dikirim user. Nama bisa berbeda, misalnya:
- “Resume” cocok dengan “RESUME MEDIS”
- “Lab” cocok dengan “HASIL LABORATORIUM”

JIKA YANG TIDAK ADA YANG BAGIAN OPSINAL MAKA STATUS SIAP DIKIRIM KE BPJS

Tampilkan hasil seperti ini (tanpa tambahan kata di luar format berikut):

TIDAK ADA SEP  
TIDAK ADA KARTU BPJS  
RESUME MEDIS SESUAI  
HASIL LABORATORIUM SESUAI  
TIDAK ADA RADIOLOGI

JIKA SESUAI SEMUA MAKA TAMBAHKAN KATA SIAP BOLD DI PALING BAWAH

DAN JIKA ADA YANG TIDAK SESUAI BUAT KATA AGAR MNYARANKAN MEREVISI

Daftar dokumen dari user:
${fullText}
`;


    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    const resultMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: aiResponse,
      timestamp: new Date()
    };

    setMessages([resultMessage]);
  } catch (error) {
    console.error('Error extracting text or analyzing:', error);
    const errorMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'Maaf, terjadi kesalahan saat menganalisis dokumen. Silakan coba upload ulang.',
      timestamp: new Date()
    };
    setMessages([errorMessage]);
  } finally {
    setIsAnalyzing(false);
  }
}, []);

  const sendMessage = async () => {
  if (!inputMessage.trim() || !pdfContent || isLoading) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: inputMessage,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInputMessage('');
  setIsLoading(true);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Pecah berdasarkan halaman (asumsi dipisah \n setiap halaman)
    const pageTexts = pdfContent.text.split('\n');
    const pageCheck = pageTexts.map((text, index) => {
      const match = text.toLowerCase().includes('klaim bpjs');
      return `Halaman ${index + 1} : ${match ? 'Sesuai' : 'Tidak Sesuai'}`;
    }).join('\n');

    const prompt = `
Kamu adalah asisten AI yang ahli dalam menganalisis dokumen klaim BPJS Kesehatan.


3. Setelah itu, baru jawab pertanyaan user berdasarkan isi dokumen BPJS berikut ini:

KONTEN DOKUMEN:
${pdfContent.text}

PERTANYAAN USER:
${inputMessage}

JANGAN PERNAH MENGUBAH FORMAT HASIL ANALISA HALAMAN. Pastikan hasil selalu dimulai dengan:
${pageCheck}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: aiResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex">
      {/* Left Panel - PDF Viewer */}
      <div className="flex-1 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white p-6 flex items-center gap-4 shadow-lg">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">DEXTRA BPJS</h1>
            <p className="text-emerald-100 text-sm font-medium">Document Analyzer</p>
          </div>
          <div className="ml-auto">
            <Sparkles className="w-6 h-6 text-emerald-200 animate-pulse" />
          </div>
        </div>

        {/* Upload Area */}
        <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-emerald-400 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 transition-all duration-300 group"
          >
            <div className="p-2 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
              <Upload className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-800">Upload Dokumen BPJS</div>
              <div className="text-sm text-gray-500">Drag & drop atau klik untuk memilih file PDF</div>
            </div>
          </button>
          {file && (
            <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50/50 to-white/50">
          {file && (
            <div className="flex flex-col items-center">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                className="shadow-2xl rounded-2xl overflow-hidden"
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div key={`page_${index + 1}`} className="mb-4">
                    <div className="text-center mb-2">
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                        Halaman {index + 1}
                      </span>
                    </div>
                    <Page
                      pageNumber={index + 1}
                      width={600}
                      className="border border-gray-200 rounded-xl shadow-lg"
                    />
                  </div>
                ))}
              </Document>
            </div>
          )}
          
          {!file && (
            <div className="h-full flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="text-center">
                <div className="p-6 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl mb-6 inline-block">
                  <FileText className="w-20 h-20 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Siap untuk Analisis</h3>
                <p className="text-gray-500">Upload dokumen PDF BPJS untuk memulai verifikasi otomatis</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - AI Assistant */}
      <div className="w-96 bg-white/90 backdrop-blur-sm flex flex-col shadow-2xl h-screen">
        {/* AI Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 flex items-center gap-4 shadow-lg flex-shrink-0">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Assistant</h2>
            <p className="text-blue-100 text-sm font-medium">Analisis Cerdas</p>
          </div>
        </div>

        {/* Status */}
        {isAnalyzing && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50 flex-shrink-0">
            <div className="flex items-center gap-3 text-blue-700">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Loader className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="font-semibold">Menganalisis Dokumen</div>
                <div className="text-sm text-blue-600">Memproses dengan AI...</div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/30 to-white/50 min-h-0">
          {messages.length === 0 && !isAnalyzing && (
            <div className="text-center text-gray-500 mt-12">
              <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mb-6 inline-block">
                <Bot className="w-16 h-16 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Siap Membantu</h3>
              <p className="text-sm text-gray-500">Upload dokumen BPJS untuk memulai analisis cerdas</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl shadow-md ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div 
                  className="whitespace-pre-wrap text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br>')
                  }}
                />
                <p className="text-xs mt-3 opacity-70 font-medium">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-800 p-4 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-semibold">AI sedang berpikir...</div>
                    <div className="text-sm text-gray-600">Menganalisis respons terbaik</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tanyakan tentang dokumen BPJS..."
              className="flex-1 p-4 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 backdrop-blur-sm shadow-sm"
              rows={2}
              disabled={!pdfContent || isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !pdfContent || isLoading}
              className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 font-medium">
            Tekan Enter untuk kirim, Shift+Enter untuk baris baru
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
