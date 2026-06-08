'use client';

import { useCallback, useState, useRef } from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  loading: boolean;
}

export default function FileUpload({ onFileUpload, loading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    );
    
    if (excelFile) {
      onFileUpload(excelFile);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleBrowseClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-label="Excel File Upload Dropzone"
      className={`
        border-2 border-dashed rounded-2xl p-10 md:p-14 text-center transition-all duration-300 transform
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50/40 scale-[1.01] shadow-xl shadow-indigo-50/50' 
          : 'border-slate-300 bg-white hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5'
        }
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleFileSelect}
        disabled={loading}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
        {loading ? (
          <div className="flex flex-col items-center py-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-100 border-t-indigo-600 mb-4"></div>
            </div>
            <p className="text-lg font-bold text-slate-800 animate-pulse">Analyzing Orders Spreadsheet...</p>
            <p className="text-sm text-slate-500 mt-1 font-medium">Extracting rows & syncing with database</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Styled Icon Wrapper */}
            <div className={`p-4 rounded-full mb-5 transition-all duration-300 ${isDragging ? 'bg-indigo-100 text-indigo-600 scale-110' : 'bg-slate-50 text-slate-400'}`}>
              <UploadCloud className={`w-12 h-12 ${isDragging ? 'animate-bounce' : ''}`} />
            </div>

            <p className="text-xl font-bold text-slate-800 mb-1">
              Drag and drop your spreadsheet here
            </p>
            <p className="text-sm text-slate-500 mb-4 font-medium">
              Only Excel formats (.xlsx, .xls) are supported
            </p>
            
            <div className="flex items-center gap-3 w-full justify-center my-3">
              <div className="h-[1px] bg-slate-200 w-16" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
              <div className="h-[1px] bg-slate-200 w-16" />
            </div>

            <button
              type="button"
              onClick={handleBrowseClick}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-indigo-100/50 hover:shadow-indigo-200/50 active:scale-95"
              aria-label="Browse local files for upload"
            >
              Browse Files
            </button>
          </div>
        )}
      </label>
    </div>
  );
}
