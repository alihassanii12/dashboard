"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { 
  Search, 
  Clock, 
  Folder, 
  Star,
  Upload,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  X,
  MoreVertical,
  Download,
  RotateCw,
  Plus,
  Archive,
  Lock,
  Trash2,
  ChevronDown,
  FolderPlus,
  AlertCircle,
  Video,
  Edit2,
  Home,
  CheckCircle,
  Loader,
  Menu,
  LogOut,
  User,
  Cloud,
  Share2,
  Copy,
  Calendar,
  Bell,
  HardDrive,
  Image as ImageIcon,
  Play,
  Heart,
  Sparkles,
  LayoutGrid,
  List,
  SortDesc,
  SortAsc,
  TrendingUp,
  Info,
  Mail,
  Key,
  RotateCcw,
  RefreshCw,
  Eye,
  EyeOff,
  Fullscreen,
  Minimize,
  Pencil,
  ArrowLeft,
  ArrowRight,
  Unlock,
  CheckSquare,
  Square
} from "lucide-react";

// ==================== API CONFIGURATION ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://image-library-backend-5ola.vercel.app';
const WEBSITE_URL = "https://website-ten-lemon-5x7d9qtg7q.vercel.app";

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// ==================== TYPES ====================
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  storageUsed: number;
  storageTotal: number;
  auth_provider?: 'google' | 'local';
}

interface UploadedMedia {
  _id: string;
  url: string;
  originalName: string;
  type: string;
  createdAt: string;
  favorite: boolean;
  albumId?: string;
  isLocked?: boolean;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  isFolder?: boolean;
  color?: string;
  hash?: string;
  trashedAt?: string;
  scheduledDeleteAt?: string;
  daysLeft?: number;
}

interface Album {
  _id: string;
  name: string;
  description: string;
  coverUrl: string;
  media: any[];
  category: string;
  createdAt: string;
  updatedAt: string;
  parentAlbumId?: string | null;
  isFolder?: boolean;
  userId?: number;
  color?: string;
}

interface LockState {
  isLocked: boolean;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

// ==================== DROPDOWN MENU COMPONENT ====================
interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
  }[];
  align?: 'left' | 'right';
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl py-1 z-50 animate-fade-in`}>
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 hover:bg-gray-800 flex items-center space-x-3 text-sm transition-colors ${
                item.danger ? 'text-red-400' : 'text-gray-300'
              }`}
            >
              <span className={item.danger ? 'text-red-400' : 'text-gray-400'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== MOVE MODAL COMPONENT ====================
interface MoveModalProps {
  show: boolean;
  onClose: () => void;
  albumTree: Album[];
  currentFolderPath: Album[];
  setCurrentFolderPath: (path: Album[]) => void;
  selectedTargetAlbum: string | null;
  setSelectedTargetAlbum: (id: string | null) => void;
  onMove: (targetId: string | null) => void;
  isMoving: boolean;
}

const MoveModal: React.FC<MoveModalProps> = ({ 
  show, 
  onClose, 
  albumTree, 
  currentFolderPath, 
  setCurrentFolderPath,
  selectedTargetAlbum, 
  setSelectedTargetAlbum,
  onMove,
  isMoving 
}) => {
  if (!show) return null;

  const currentFolderId = currentFolderPath.length > 0 
    ? currentFolderPath[currentFolderPath.length - 1]._id 
    : null;
  
  const currentItems = albumTree.filter(item => 
    item.parentAlbumId === currentFolderId
  ).sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  const navigateInto = (item: Album) => {
    setCurrentFolderPath([...currentFolderPath, item]);
    setSelectedTargetAlbum(item._id);
  };

  const navigateBack = () => {
    if (currentFolderPath.length > 0) {
      const newPath = [...currentFolderPath];
      newPath.pop();
      setCurrentFolderPath(newPath);
      
      if (newPath.length > 0) {
        setSelectedTargetAlbum(newPath[newPath.length - 1]._id);
      } else {
        setSelectedTargetAlbum(null);
      }
    }
  };

  const goToRoot = () => {
    setCurrentFolderPath([]);
    setSelectedTargetAlbum(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-70 p-4">
      <div className="bg-gray-900 rounded-3xl p-6 max-w-lg w-full border border-gray-800 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Move to Album/Folder</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-xl transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={goToRoot}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm transition ${
              currentFolderPath.length === 0
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Main Library
          </button>
          
          {currentFolderPath.map((folder, index) => (
            <React.Fragment key={folder._id}>
              <ChevronRight size={14} className="text-gray-600" />
              <button
                onClick={() => {
                  const newPath = currentFolderPath.slice(0, index + 1);
                  setCurrentFolderPath(newPath);
                  setSelectedTargetAlbum(folder._id);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm transition ${
                  index === currentFolderPath.length - 1
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {currentFolderPath.length > 0 && (
            <button
              onClick={navigateBack}
              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 transition"
            >
              <ArrowLeft size={18} className="text-gray-400" />
              <span>.. (Go back)</span>
            </button>
          )}

          {currentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder size={40} className="mx-auto mb-2 text-gray-600" />
              <p>No folders or albums here</p>
            </div>
          ) : (
            currentItems.map(item => (
              <div
                key={item._id}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                  selectedTargetAlbum === item._id
                    ? 'bg-blue-600/20 border border-blue-600/30'
                    : 'hover:bg-gray-800'
                }`}
                onClick={() => {
                  if (item.isFolder) {
                    navigateInto(item);
                  } else {
                    setSelectedTargetAlbum(item._id);
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  {item.isFolder ? (
                    <Folder size={20} className="text-blue-400" />
                  ) : (
                    <Folder size={20} className="text-purple-400" />
                  )}
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.isFolder ? 'Folder' : 'Album'} • {item.media?.length || 0} items
                    </p>
                  </div>
                </div>
                
                {item.isFolder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateInto(item);
                    }}
                    className="p-1.5 hover:bg-gray-700 rounded-lg transition"
                  >
                    <ArrowRight size={16} className="text-gray-400" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex space-x-3 pt-4 border-t border-gray-800">
          <button
            onClick={() => {
              const targetId = currentFolderPath.length > 0 
                ? currentFolderPath[currentFolderPath.length - 1]._id 
                : null;
              onMove(targetId);
            }}
            disabled={isMoving}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 font-medium"
          >
            {isMoving ? 'Moving...' : `Move ${selectedTargetAlbum ? 'Here' : 'to Main Library'}`}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== UPLOAD MODAL COMPONENT ====================
interface UploadModalProps {
  show: boolean;
  onClose: () => void;
  files: File[];
  previews: string[];
  isUploading: boolean;
  uploadProgress: { [key: string]: number };
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: (e: React.FormEvent) => Promise<void>;
  formatFileSize: (bytes?: number) => string;
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setPreviews: React.Dispatch<React.SetStateAction<string[]>>;
  currentAlbumId?: string | null;
  currentAlbumName?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ 
  show, 
  onClose, 
  files, 
  previews, 
  isUploading, 
  uploadProgress, 
  onFileSelect, 
  onUpload, 
  formatFileSize,
  setFiles,
  setPreviews,
  currentAlbumId,
  currentAlbumName
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileArray = Array.from(e.dataTransfer.files);
      const validFiles = fileArray.filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      
      if (validFiles.length !== fileArray.length) {
        toast.error('Some files were skipped (only images and videos allowed)');
      }
      
      if (validFiles.length > 0) {
        const event = {
          target: { files: validFiles }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFileSelect(event);
      }
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const completedFiles = uploadProgress ? 
    Object.keys(uploadProgress).filter(key => 
      key.startsWith('file-') && uploadProgress[key] === 100
    ).length : 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl p-6 max-w-2xl w-full border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-900 pt-2">
          <h3 className="text-xl font-bold text-white">
            {currentAlbumName ? `Upload to "${currentAlbumName}"` : 'Upload Media'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-xl transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={onUpload} className="space-y-6">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept="image/*,video/*"
              onChange={onFileSelect}
              className="hidden"
              multiple
              disabled={isUploading}
            />
            
            {previews.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2">
                  {previews.map((preview, index) => {
                    const fileProgress = uploadProgress[`file-${index}`] || 0;
                    const isComplete = fileProgress === 100;
                    
                    return (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-800">
                          {files[index]?.type.startsWith("video/") ? (
                            <video src={preview} className="w-full h-full object-cover" />
                          ) : (
                            <img src={preview} alt={`preview-${index}`} className="w-full h-full object-cover" />
                          )}
                        </div>
                        
                        {isUploading && !isComplete && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-xs font-bold text-white mb-1">
                                {fileProgress}%
                              </div>
                              <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600 transition-all duration-300"
                                  style={{ width: `${fileProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isComplete && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle size={16} className="text-green-400" />
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = files.filter((_, i) => i !== index);
                            const newPreviews = previews.filter((_, i) => i !== index);
                            setFiles(newFiles);
                            setPreviews(newPreviews);
                          }}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                          disabled={isUploading}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                  disabled={isUploading}
                >
                  + Add more files
                </button>
              </div>
            ) : (
              <label htmlFor="fileInput" className="cursor-pointer block">
                <div className="inline-flex p-4 bg-blue-600/10 rounded-2xl mb-4 group-hover:bg-blue-600/20 transition">
                  <Upload size={32} className="text-blue-600" />
                </div>
                <p className="text-gray-300 font-medium mb-1">
                  Click to select or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  Supports images and videos up to 100MB each
                </p>
              </label>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm bg-gray-800/50 rounded-xl p-3">
                <div>
                  <span className="text-white font-medium">{files.length}</span>
                  <span className="text-gray-400"> files • </span>
                  <span className="text-white font-medium">{formatFileSize(totalSize)}</span>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiles([]);
                      setPreviews([]);
                    }}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {isUploading && uploadProgress.overall !== undefined && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Upload progress</span>
                      <span className="text-blue-400 font-medium">{uploadProgress.overall}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {completedFiles}/{files.length} files completed
                    </div>
                  </div>
                  
                  <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-600 to-blue-400 transition-all duration-300 relative"
                      style={{ width: `${uploadProgress.overall}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 mt-4 p-2 bg-gray-800/30 rounded-xl">
                    {files.map((file, index) => {
                      const fileProgress = uploadProgress[`file-${index}`] || 0;
                      const isComplete = fileProgress === 100;
                      
                      return (
                        <div key={index} className="flex items-center space-x-3 text-sm">
                          <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                            {file.type.startsWith('video/') ? (
                              <Video size={16} className="text-blue-400" />
                            ) : (
                              <ImageIcon size={16} className="text-green-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                              <p className="text-white truncate">{file.name}</p>
                              <span className="text-xs text-gray-400 ml-2 shrink-0">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    isComplete ? 'bg-green-500' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${fileProgress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 min-w-10">
                                {fileProgress}%
                              </span>
                              {isComplete && (
                                <CheckCircle size={14} className="text-green-400 shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-800 sticky bottom-0 bg-gray-900 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={files.length === 0 || isUploading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 font-medium relative overflow-hidden group"
            >
              {isUploading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading... {uploadProgress.overall || 0}%</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Upload size={18} />
                  <span>Upload {files.length} file{files.length !== 1 ? 's' : ''}</span>
                </span>
              )}
              
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== CREATE ALBUM MODAL ====================
interface CreateAlbumModalProps {
  show: boolean;
  onClose: () => void;
  albumName: string;
  albumDescription: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreate: (e: React.FormEvent) => Promise<void>;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ 
  show, 
  onClose, 
  albumName, 
  albumDescription, 
  onNameChange, 
  onDescriptionChange, 
  onCreate 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">Create New Album</h3>
        <form onSubmit={onCreate} className="space-y-4">
          <input
            type="text"
            placeholder="Album Name"
            value={albumName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={albumDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!albumName}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== CREATE FOLDER MODAL ====================
interface CreateFolderModalProps {
  show: boolean;
  onClose: () => void;
  folderName: string;
  albumName: string;
  onNameChange: (value: string) => void;
  onCreate: (e: React.FormEvent) => Promise<void>;
  parentAlbumId?: string | null;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ 
  show, 
  onClose, 
  folderName, 
  albumName, 
  onNameChange, 
  onCreate,
  parentAlbumId 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-2">New Folder</h3>
        <p className="text-sm text-gray-400 mb-4">in "{albumName}"</p>
        <form onSubmit={onCreate} className="space-y-4">
          <input
            type="text"
            placeholder="Folder Name"
            value={folderName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== PASSWORD MODAL ====================
interface PasswordModalProps {
  show: boolean;
  onClose: () => void;
  hasLockedAccess: boolean;
  hasLockPassword: boolean;
  lockPassword: string;
  lockState: LockState;
  passwordError: string;
  isSettingPassword: boolean;
  showLockPassword: boolean;
  onLockPasswordChange: (value: string) => void;
  onLockStateChange: React.Dispatch<React.SetStateAction<LockState>>;
  onShowLockPasswordChange: (value: boolean) => void;
  onSetPassword: (e: React.FormEvent) => Promise<void>;
  onVerifyPassword: (e: React.FormEvent) => Promise<void>;
  timeLeft?: number;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ 
  show, 
  onClose, 
  hasLockedAccess, 
  hasLockPassword, 
  lockPassword, 
  lockState, 
  passwordError, 
  isSettingPassword, 
  showLockPassword, 
  onLockPasswordChange, 
  onLockStateChange, 
  onShowLockPasswordChange, 
  onSetPassword, 
  onVerifyPassword,
  timeLeft 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-800">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-600/10 rounded-2xl mb-3">
            <Lock size={32} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {!hasLockPassword ? 'Set Lock Password' : hasLockedAccess ? 'Locked Folder Active' : 'Enter Password'}
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            {!hasLockPassword 
              ? 'Create a password to protect your private media' 
              : hasLockedAccess 
              ? 'You have access to locked folder for 5 minutes' 
              : 'Enter the password to access locked media (5 minute session)'}
          </p>
        </div>

        {!hasLockPassword ? (
          <form onSubmit={onSetPassword} className="space-y-4">
            <div className="relative">
              <input
                type={lockState.showPassword ? "text" : "password"}
                value={lockState.password}
                onChange={(e) => onLockStateChange(prev => ({ ...prev, password: e.target.value }))}
                placeholder="New password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => onLockStateChange(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
              >
                {lockState.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={lockState.showConfirmPassword ? "text" : "password"}
                value={lockState.confirmPassword}
                onChange={(e) => onLockStateChange(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => onLockStateChange(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
              >
                {lockState.showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {passwordError && (
              <p className="text-sm text-red-400">{passwordError}</p>
            )}

            <button
              type="submit"
              disabled={isSettingPassword}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {isSettingPassword ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>
        ) : !hasLockedAccess ? (
          <form onSubmit={onVerifyPassword} className="space-y-4">
            <div className="relative">
              <input
                type={showLockPassword ? "text" : "password"}
                value={lockPassword}
                onChange={(e) => onLockPasswordChange(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => onShowLockPasswordChange(!showLockPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
              >
                {showLockPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {passwordError && (
              <p className="text-sm text-red-400">{passwordError}</p>
            )}

            <button
              type="submit"
              disabled={isSettingPassword}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {isSettingPassword ? 'Verifying...' : 'Access Locked Folder'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-green-400 mb-4">✓ You have access to locked folder</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
            >
              Continue to Locked Folder
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ==================== EDIT NAME MODAL ====================
interface EditNameModalProps {
  show: boolean;
  onClose: () => void;
  currentName: string;
  onNameChange: (value: string) => void;
  onSave: () => Promise<void>;
}

const EditNameModal: React.FC<EditNameModalProps> = ({ 
  show, 
  onClose, 
  currentName, 
  onNameChange, 
  onSave 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
      <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">Edit Name</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
          <input
            type="text"
            value={currentName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            autoFocus
          />
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!currentName.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== MEDIA MODAL ====================
interface MediaModalProps {
  media: UploadedMedia;
  onClose: () => void;
  showSidePanel: boolean;
  onToggleSidePanel: () => void;
  selectedCategory: string;
  onToggleFavorite: (id: string) => Promise<void>;
  onToggleLock: (id: string) => Promise<void>;
  onMoveToTrash: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  onMoveToOriginal?: (id: string) => Promise<void>;
  onMoveToAlbum?: (id: string) => void;
  onEditName: () => void;
  formatFileSize: (bytes?: number) => string;
  formatDate: (dateString?: string) => string;
  toggleFullscreen: (element: HTMLElement) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  totalMedia?: number;
  currentIndex?: number;
}

const MediaModal: React.FC<MediaModalProps> = ({ 
  media, 
  onClose, 
  showSidePanel, 
  onToggleSidePanel, 
  selectedCategory, 
  onToggleFavorite, 
  onToggleLock,
  onMoveToOriginal,
  onMoveToAlbum,
  onMoveToTrash, 
  onRestore, 
  onPermanentDelete, 
  onEditName, 
  formatFileSize, 
  formatDate, 
  toggleFullscreen,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  totalMedia,
  currentIndex
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-black/80 to-transparent p-4 z-10 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`p-2.5 bg-black/50 hover:bg-gray-900 rounded-xl text-white transition ${
                !hasPrevious ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Previous"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`p-2.5 bg-black/50 hover:bg-gray-900 rounded-xl text-white transition ${
                !hasNext ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Next"
            >
              <ArrowRight size={20} />
            </button>
            {totalMedia && currentIndex && (
              <span className="text-white text-sm bg-black/50 px-3 py-1.5 rounded-xl">
                {currentIndex} / {totalMedia}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {media.type === "video" && (
              <button
                onClick={() => videoRef.current && toggleFullscreen(videoRef.current)}
                className="p-2.5 bg-black/50 hover:bg-gray-900 rounded-xl text-white transition"
                title="Fullscreen"
              >
                <Fullscreen size={20} />
              </button>
            )}

            <button
              onClick={onToggleSidePanel}
              className="p-2.5 bg-black/50 hover:bg-gray-900 rounded-xl text-white transition"
              title="Details"
            >
              <MoreVertical size={20} />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 bg-black/50 hover:bg-gray-900 rounded-xl text-white transition"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 mt-16">
          {media.type === "video" ? (
            <video
              ref={videoRef}
              src={media.url}
              controls
              className="max-h-full max-w-full rounded-2xl shadow-2xl"
              controlsList="nodownload"
            />
          ) : (
            <>
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={64} className="text-gray-600" />
                </div>
              ) : (
                <img
                  src={media.url}
                  alt={media.originalName}
                  className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                  onError={() => setImageError(true)}
                />
              )}
            </>
          )}
        </div>

        {showSidePanel && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto z-20">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-medium text-white">Details</h3>
              <button
                onClick={onToggleSidePanel}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-800">
              <h3 className="font-medium text-white text-lg mb-1 warp-break-words ">{media.originalName}</h3>
              <p className="text-sm text-gray-400">
                {formatDate(media.createdAt)} • {formatFileSize(media.size)}
              </p>
              {media.isLocked && (
                <div className="mt-2 inline-flex items-center space-x-1 bg-blue-600/20 text-blue-400 px-2 py-1 rounded-lg text-xs">
                  <Lock size={12} />
                  <span>Locked</span>
                </div>
              )}
            </div>

            <div className="p-4 border-b border-gray-800">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions</h4>
              <div className="space-y-2">
                {selectedCategory === "Trash" ? (
                  <>
                    <button
                      onClick={() => onRestore(media._id)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <RotateCcw size={18} className="text-green-400" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => {
                        toast((t) => (
                          <div className="flex flex-col items-center gap-3">
                            <p className="text-white font-medium">Delete permanently?</p>
                            <p className="text-gray-400 text-sm">This action cannot be undone.</p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={async () => {
                                  toast.dismiss(t.id);
                                  await onPermanentDelete(media._id);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => toast.dismiss(t.id)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ), {
                          duration: 10000,
                          style: {
                            background: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '1rem',
                            padding: '1rem',
                          },
                        });
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-red-400 text-sm transition"
                    >
                      <Trash2 size={18} />
                      <span>Delete permanently</span>
                    </button>
                  </>
                ) : selectedCategory === "Locked" ? (
                  <>
                    <button
                      onClick={() => window.open(media.url, '_blank')}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <Download size={18} />
                      <span>Download</span>
                    </button>
                    
                    <button
                      onClick={onEditName}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <Pencil size={18} />
                      <span>Edit name</span>
                    </button>
                    
                    <button
                      onClick={() => onToggleFavorite(media._id)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <Star size={18} className={media.favorite ? "text-yellow-400 fill-yellow-400" : ""} />
                      <span>{media.favorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                    </button>
                    
                    <button
                      onClick={() => onMoveToOriginal && onMoveToOriginal(media._id)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <Unlock size={18} className="text-green-400" />
                      <span>Move to Main Library</span>
                    </button>
                    
                    <button
                      onClick={() => onMoveToTrash(media._id)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-red-400 text-sm transition"
                    >
                      <Trash2 size={18} />
                      <span>Move to trash</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => window.open(media.url, '_blank')}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <Download size={18} />
                      <span>Download</span>
                    </button>
                    
                    <button
                      onClick={onEditName}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <Pencil size={18} />
                      <span>Edit name</span>
                    </button>
                    
                    <button
                      onClick={() => onToggleFavorite(media._id)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <Star size={18} className={media.favorite ? "text-yellow-400 fill-yellow-400" : ""} />
                      <span>{media.favorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                    </button>
                    
                    <button
                      onClick={() => onMoveToAlbum && onMoveToAlbum(media._id)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <FolderPlus size={18} className="text-blue-400" />
                      <span>Move to Album/Folder</span>
                    </button>
                    
                    <button
                      onClick={() => onToggleLock(media._id)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-gray-300 text-sm transition"
                    >
                      <Lock size={18} />
                      <span>{media.isLocked ? 'Unlock' : 'Lock'}</span>
                    </button>
                    
                    <button
                      onClick={() => onMoveToTrash(media._id)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-xl text-red-400 text-sm transition"
                    >
                      <Trash2 size={18} />
                      <span>Move to trash</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-white uppercase">{media.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Size:</span>
                  <span className="text-white">{formatFileSize(media.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uploaded:</span>
                  <span className="text-white">{formatDate(media.createdAt)}</span>
                </div>
                {media.trashedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deletes in:</span>
                    <span className="text-red-400">{media.daysLeft} days</span>
                  </div>
                )}
                {media.isLocked && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="text-blue-400">Locked</span>
                  </div>
                )}
                {media.albumId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="text-blue-400 flex items-center space-x-1">
                      <Folder size={12} />
                      <span>In Folder</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!showSidePanel && (
          <>
            <div 
              className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer hidden sm:block"
              onClick={hasPrevious ? onPrevious : undefined}
              style={{ pointerEvents: hasPrevious ? 'auto' : 'none' }}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer hidden sm:block"
              onClick={hasNext ? onNext : undefined}
              style={{ pointerEvents: hasNext ? 'auto' : 'none' }}
            />
          </>
        )}
      </div>
    </div>
  );
};

// ==================== MEDIA ITEM COMPONENT ====================
interface MediaItemProps {
  item: UploadedMedia;
  viewMode: 'grid' | 'list';
  selectedCategory: string;
  selectedItems: string[];
  onToggleSelect: (id: string) => void;
  onClick: (item: UploadedMedia) => void;
  onToggleFavorite: (id: string) => Promise<void>;
  onToggleLock: (id: string) => Promise<void>;
  onMoveToTrash: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  onMoveToOriginal?: (id: string) => Promise<void>;
  onMoveToAlbum?: (id: string) => void;
  formatFileSize: (bytes?: number) => string;
  formatDate: (dateString?: string) => string;
  isSelectionMode?: boolean;
  showMobileMenu?: string | null;
  onMobileMenuToggle?: (id: string) => void;
  currentAlbumId?: string | null;
}

const MediaItem: React.FC<MediaItemProps> = ({ 
  item, 
  viewMode, 
  selectedCategory, 
  selectedItems, 
  onToggleSelect, 
  onClick, 
  onToggleFavorite, 
  onToggleLock,
  onMoveToOriginal,
  onMoveToAlbum,
  onMoveToTrash, 
  onRestore, 
  onPermanentDelete, 
  formatFileSize, 
  formatDate,
  isSelectionMode,
  showMobileMenu,
  onMobileMenuToggle,
  currentAlbumId
}) => {
  const isSelected = selectedItems.includes(item._id);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={viewMode === 'grid' ? "" : "flex items-center bg-gray-900 p-3 rounded-xl hover:bg-gray-800 transition"}>
      {viewMode === 'grid' && (
        <div className="relative group">
          <div
            onClick={() => {
              if (isSelectionMode) {
                onToggleSelect(item._id);
              } else {
                onClick(item);
              }
            }}
            className={`aspect-square bg-gray-900 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
              isSelected 
                ? 'border-blue-600' 
                : 'border-transparent group-hover:border-blue-600'
            }`}
          >
            {selectedCategory === "Trash" ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                {item.type === 'video' ? (
                  <Video size={48} className="text-gray-600" />
                ) : (
                  <ImageIcon size={48} className="text-gray-600" />
                )}
              </div>
            ) : selectedCategory === "Locked" ? (
              <div className="w-full h-full">
                {item.type === "video" ? (
                  <div className="relative w-full h-full">
                    <video src={item.url} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-lg">
                      <Play size={14} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <>
                    {imageError ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <ImageIcon size={48} className="text-gray-500" />
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt={item.originalName} 
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    )}
                  </>
                )}
                <div className="absolute top-2 left-2 bg-blue-600/80 text-white p-1 rounded-lg">
                  <Lock size={14} />
                </div>
              </div>
            ) : item.isLocked ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <Lock size={48} className="text-gray-400" />
              </div>
            ) : item.type === "video" ? (
              <div className="relative w-full h-full">
                <video src={item.url} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-lg">
                  <Play size={14} className="text-white" />
                </div>
              </div>
            ) : (
              <>
                {imageError ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <ImageIcon size={48} className="text-gray-500" />
                  </div>
                ) : (
                  <img 
                    src={item.url} 
                    alt={item.originalName} 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                )}
              </>
            )}
          </div>

          {item.favorite && selectedCategory !== "Trash" && !item.isLocked && (
            <div className="absolute top-2 left-2">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
            </div>
          )}

          {selectedCategory === "Trash" && item.daysLeft !== undefined && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">
              {item.daysLeft}d left
            </div>
          )}

          {item.albumId && !selectedCategory.includes("Album") && selectedCategory !== "Albums" && !currentAlbumId && (
            <div className="absolute top-2 right-8 bg-blue-600/80 text-white p-1 rounded-lg text-xs">
              <Folder size={12} />
            </div>
          )}

          {isSelectionMode && (
            <div className={`absolute top-2 right-2 w-5 h-5 rounded-lg border-2 flex items-center justify-center ${
              isSelected 
                ? 'bg-blue-600 border-blue-600' 
                : 'border-gray-400 bg-black/50'
            }`}>
              {isSelected && <CheckCircle size={14} className="text-white" />}
            </div>
          )}

          {!isSelectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMobileMenuToggle && onMobileMenuToggle(item._id);
              }}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-gray-800 rounded-xl text-white opacity-0 group-hover:opacity-100 transition md:hidden"
            >
              <MoreVertical size={16} />
            </button>
          )}

          <p className="text-xs text-gray-400 mt-2 truncate px-1">{item.originalName}</p>
          
          {selectedCategory !== "Locked" && item.isLocked && (
            <div className="absolute bottom-8 right-2 bg-blue-600/80 text-white p-1 rounded-lg text-xs">
              <Lock size={12} />
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item._id)}
            className="mr-4 w-4 h-4 rounded-lg border-2 border-gray-600 bg-black text-blue-600"
          />
          <div
            onClick={() => onClick(item)}
            className="flex-1 flex items-center cursor-pointer min-w-0"
          >
            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mr-4 shrink-0">
              {item.type === 'video' ? (
                <Video size={20} className="text-blue-400" />
              ) : (
                <ImageIcon size={20} className="text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{item.originalName}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(item.size)} • {formatDate(item.createdAt)}
                {item.isLocked && <Lock size={10} className="inline ml-1" />}
                {item.favorite && <Star size={10} className="inline ml-1 text-yellow-400 fill-yellow-400" />}
                {item.albumId && <Folder size={10} className="inline ml-1 text-blue-400" />}
              </p>
            </div>
          </div>
          <div className="flex space-x-2 ml-4">
            {selectedCategory === "Trash" ? (
              <>
                <button
                  onClick={() => onRestore(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title="Restore"
                >
                  <RotateCcw size={16} className="text-green-400" />
                </button>
                <button
                  onClick={() => onPermanentDelete(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title="Delete permanently"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </>
            ) : selectedCategory === "Locked" ? (
              <>
                <button
                  onClick={() => onToggleFavorite(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title={item.favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star size={16} className={item.favorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"} />
                </button>
                <button
                  onClick={() => onMoveToOriginal && onMoveToOriginal(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title="Move to main library"
                >
                  <Unlock size={16} className="text-green-400" />
                </button>
                <button
                  onClick={() => onMoveToTrash(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title="Move to trash"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onToggleFavorite(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title={item.favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star size={16} className={item.favorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400"} />
                </button>
                <button
                  onClick={() => onMoveToAlbum && onMoveToAlbum(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title="Move to Album/Folder"
                >
                  <FolderPlus size={16} className="text-blue-400" />
                </button>
                <button
                  onClick={() => onToggleLock(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title={item.isLocked ? "Unlock" : "Lock"}
                >
                  <Lock size={16} className="text-blue-400" />
                </button>
                <button
                  onClick={() => onMoveToTrash(item._id)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition"
                  title="Move to trash"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== MAIN DASHBOARD COMPONENT ====================
const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Media states
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [trashMedia, setTrashMedia] = useState<UploadedMedia[]>([]);
  const [lockedMedia, setLockedMedia] = useState<UploadedMedia[]>([]);
  
  // UI states
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("For You");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<UploadedMedia | null>(null);
  const [showMediaModal, setShowMediaModal] = useState<boolean>(false);
  const [showMediaSidePanel, setShowMediaSidePanel] = useState<boolean>(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumPath, setAlbumPath] = useState<Album[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(-1);
  const [allDisplayMedia, setAllDisplayMedia] = useState<UploadedMedia[]>([]);
  const [showMobileSearch, setShowMobileSearch] = useState<boolean>(false);
  const [mobileItemMenu, setMobileItemMenu] = useState<string | null>(null);
  const [sessionExpiryTime, setSessionExpiryTime] = useState<Date | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  // Modal states
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [mediaToMove, setMediaToMove] = useState<string | null>(null);
  const [selectedTargetAlbum, setSelectedTargetAlbum] = useState<string | null>(null);
  const [albumTree, setAlbumTree] = useState<Album[]>([]);
  const [currentFolderPath, setCurrentFolderPath] = useState<Album[]>([]);

  const [lockState, setLockState] = useState<LockState>({
    isLocked: false,
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });
  const [hasLockedAccess, setHasLockedAccess] = useState<boolean>(false);
  const [hasLockPassword, setHasLockPassword] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [lockPassword, setLockPassword] = useState<string>('');
  const [showLockPassword, setShowLockPassword] = useState<boolean>(false);
  const [isSettingPassword, setIsSettingPassword] = useState<boolean>(false);
  const [showEditNameModal, setShowEditNameModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [accessTimeLeft, setAccessTimeLeft] = useState<number>(0);
  const [showTimer, setShowTimer] = useState<boolean>(false);

  // File upload states
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [showCreateAlbum, setShowCreateAlbum] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>("");
  const [newAlbumDescription, setNewAlbumDescription] = useState<string>("");
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [nestedAlbums, setNestedAlbums] = useState<Album[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalVideos: 0,
    totalImages: 0,
    totalAlbums: 0,
    totalStorage: 0
  });

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // ==================== AUTHENTICATION CHECK ====================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication...');
        console.log('📍 Current URL:', window.location.href);
        
        // Check URL for token (from login redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        const refreshTokenFromUrl = urlParams.get('refreshToken');
        
        console.log('📍 URL params:', { 
          token: tokenFromUrl ? '✅' : '❌', 
          refreshToken: refreshTokenFromUrl ? '✅' : '❌' 
        });
        
        // If token in URL, save it
        if (tokenFromUrl) {
          localStorage.setItem('token', tokenFromUrl);
          if (refreshTokenFromUrl) {
            localStorage.setItem('refreshToken', refreshTokenFromUrl);
          }
          
          // Clean URL (remove token params)
          window.history.replaceState({}, '', window.location.pathname);
          console.log('✅ Token saved from URL');
        }
        
        // Check localStorage for token
        const token = localStorage.getItem('token');
        console.log('📦 Token in localStorage:', token ? '✅' : '❌');
        
        // Also check cookies (for debugging)
        console.log('🍪 Document cookies:', document.cookie);
        
        if (!token) {
          console.log('❌ No token found, redirecting to website login');
          toast.error('Please login first');
          setTimeout(() => {
            window.location.href = `${WEBSITE_URL}/login`;
          }, 1000);
          return;
        }
        
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.withCredentials = true;
        
        // Verify token with backend
        console.log('🔍 Verifying token with backend...');
        const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          },
          timeout: 10000
        }).catch(err => {
          console.error('❌ Auth API error:', err.response?.status, err.message);
          throw err;
        });
        
        console.log('✅ User response:', userRes.data);
        
        if (!userRes.data.user) {
          throw new Error('No user data');
        }
        
        setUser(userRes.data.user);
        setAuthChecked(true);
        setLoading(false);
        
        // Show success toast
        toast.success(`Welcome back, ${userRes.data.user.name}!`);
        
        // Fetch other data
        fetchData(token);
        
      } catch (err: any) {
        console.error('❌ Auth check failed:', err);
        
        let errorMessage = 'Authentication failed';
        if (err.response?.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Connection timeout. Please try again.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        toast.error(errorMessage);
        
        // Clear storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        setTimeout(() => {
          window.location.href = `${WEBSITE_URL}/login`;
        }, 2000);
      }
    };

    checkAuth();
  }, []);

  // ==================== DATA FETCHING ====================
  const fetchData = async (token: string) => {
    try {
      console.log('📁 Fetching media data...');
      
      const [mediaRes, trashRes, albumsRes, storageRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/media`, { 
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => {
          console.error('Media fetch error:', err);
          return { data: [] };
        }),
        
        axios.get(`${API_BASE_URL}/media/trash/all`, { 
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        
        axios.get(`${API_BASE_URL}/albums/all`, { 
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        
        axios.get(`${API_BASE_URL}/media/storage`, { 
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: { used: 0, total: 15 * 1024 * 1024 * 1024 } }))
      ]);

      console.log(`📁 Media loaded: ${mediaRes.data.length} items`);
      console.log(`📁 Trash loaded: ${trashRes.data.length} items`);
      console.log(`📁 Albums loaded: ${albumsRes.data.length} items`);

      setMedia(mediaRes.data);
      setTrashMedia(trashRes.data);

      const albumsWithFolderFlag = albumsRes.data.map((a: any) => ({
        ...a,
        isFolder: true,
        color: a.color || '#3B82F6'
      }));
      setAlbums(albumsWithFolderFlag);

      // Update user storage
      if (storageRes.data && user) {
        setUser(prev => prev ? {
          ...prev,
          storageUsed: storageRes.data.used || 0,
          storageTotal: storageRes.data.total || 15 * 1024 * 1024 * 1024
        } : null);
      }

      // Check locked access status
      try {
        const accessRes = await axios.get(`${API_BASE_URL}/locked/check-access`, {
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setHasLockedAccess(accessRes.data.hasAccess);
        
        if (accessRes.data.hasAccess) {
          const lockedRes = await axios.get(`${API_BASE_URL}/media/locked/all`, {
            withCredentials: true,
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => ({ data: [] }));
          setLockedMedia(lockedRes.data);
          console.log(`🔒 Locked media: ${lockedRes.data.length} items`);
        }
      } catch (err) {
        console.error('Locked access check failed:', err);
      }

    } catch (err) {
      console.error('❌ Data fetch error:', err);
      toast.error('Failed to load some data');
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = async () => {
    const logoutToast = toast.loading('Logging out...');
    
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
      
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      toast.success('Logged out successfully', { id: logoutToast });
      
      setTimeout(() => {
        window.location.href = `${WEBSITE_URL}/login`;
      }, 1000);
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error('Logout failed', { id: logoutToast });
    }
  };

  const categories = [
    { name: "For You", icon: Sparkles },
    { name: "Recent", icon: Clock },
    { name: "Images", icon: ImageIcon },
    { name: "Videos", icon: Video },
    { name: "Albums", icon: Folder },
    { name: "Favorites", icon: Star },
    { name: "Locked", icon: Lock },
    { name: "Trash", icon: Trash2 }
  ];

  // Get display media based on category
  const getDisplayMedia = useCallback((): UploadedMedia[] => {
    let filtered: UploadedMedia[] = [];
    
    if (selectedCategory === "Favorites") {
      filtered = media.filter(item => item.favorite);
    } else if (selectedCategory === "Trash") {
      filtered = trashMedia;
    } else if (selectedCategory === "Locked") {
      filtered = hasLockedAccess ? lockedMedia : [];
    } else if (selectedCategory === "Videos") {
      filtered = media.filter(item => item.type === 'video');
    } else if (selectedCategory === "Images") {
      filtered = media.filter(item => item.type === 'image');
    } else if (selectedCategory === "Recent") {
      filtered = [...media].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20);
    } else if (selectedCategory === "For You") {
      filtered = media.filter(item => !item.albumId);
    } else if (selectedCategory === "Albums") {
      filtered = [];
    } else {
      filtered = media;
    }

    if (selectedAlbum) {
      filtered = media.filter(item => item.albumId === selectedAlbum._id);
    }

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? new Date(b.createdAt || b.trashedAt || '').getTime() - new Date(a.createdAt || a.trashedAt || '').getTime()
          : new Date(a.createdAt || a.trashedAt || '').getTime() - new Date(b.createdAt || b.trashedAt || '').getTime();
      } else if (sortBy === 'name') {
        return sortOrder === 'desc'
          ? (b.originalName || '').localeCompare(a.originalName || '')
          : (a.originalName || '').localeCompare(b.originalName || '');
      } else if (sortBy === 'size') {
        return sortOrder === 'desc'
          ? (b.size || 0) - (a.size || 0)
          : (a.size || 0) - (b.size || 0);
      }
      return 0;
    });
  }, [media, trashMedia, lockedMedia, selectedCategory, selectedAlbum, searchQuery, sortBy, sortOrder, hasLockedAccess]);

  const displayMedia = useMemo(() => getDisplayMedia(), [getDisplayMedia]);

  useEffect(() => {
    setAllDisplayMedia(displayMedia);
  }, [displayMedia]);

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl text-white font-light">Loading your gallery...</h2>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER DASHBOARD ====================
  return (
    <div className="min-h-screen bg-black">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '12px',
          },
        }}
      />
      
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-30 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-800 rounded-xl transition lg:hidden"
            >
              <Menu size={20} className="text-gray-400" />
            </button>
            <span className="font-semibold text-white text-lg">ImageLibrary</span>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search your memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Upload button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-2.5 hover:bg-gray-800 rounded-xl transition relative group"
              title="Upload"
            >
              <Upload size={20} className="text-gray-400 group-hover:text-white" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1 hover:bg-gray-800 rounded-xl transition relative group"
              >
                {user?.avatar ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/50 group-hover:ring-blue-400 transition-all">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-medium text-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      {user?.avatar ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-2 py-2">
                    <button 
                      onClick={() => router.push('/settings')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-xl flex items-center space-x-3 text-sm text-gray-300 transition"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-800 my-2"></div>
                  
                  <div className="px-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 rounded-xl flex items-center space-x-3 text-sm transition"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20">
        <div className="p-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-400">
              You have {media.length} items in your library
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <ImageIcon className="text-blue-400 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{media.filter(m => m.type === 'image').length}</p>
              <p className="text-sm text-gray-400">Images</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <Video className="text-purple-400 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{media.filter(m => m.type === 'video').length}</p>
              <p className="text-sm text-gray-400">Videos</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <Folder className="text-green-400 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{albums.length}</p>
              <p className="text-sm text-gray-400">Albums</p>
            </div>
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <HardDrive className="text-yellow-400 mb-2" size={24} />
              <p className="text-2xl font-bold text-white">{formatFileSize(user?.storageUsed)}</p>
              <p className="text-sm text-gray-400">Storage Used</p>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center mb-8">
            <div className="inline-flex p-4 bg-green-500/20 rounded-2xl mb-4">
              <CheckCircle size={48} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Successful!</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              You are now logged in to your dashboard. Your session is active and secure.
            </p>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Categories</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition ${
                    selectedCategory === category.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <category.icon size={18} />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Media Grid Placeholder */}
          <div className="text-center py-12 bg-gray-900/50 rounded-3xl border border-gray-800">
            <div className="inline-flex p-4 bg-blue-600/10 rounded-2xl mb-4">
              <Sparkles size={48} className="text-blue-400" />
            </div>
            <h3 className="text-xl text-white font-medium mb-2">Your Media Will Appear Here</h3>
            <p className="text-gray-400 mb-6">Start by uploading photos and videos</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition inline-flex items-center space-x-2"
            >
              <Upload size={18} />
              <span>Upload Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        show={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setFiles([]);
          setPreviews([]);
        }}
        files={files}
        previews={previews}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        onFileSelect={(e) => {
          if (e.target.files) {
            setFiles(Array.from(e.target.files));
          }
        }}
        onUpload={async (e) => {
          e.preventDefault();
          toast.success('Upload feature coming soon!');
          setShowUploadModal(false);
        }}
        formatFileSize={formatFileSize}
        setFiles={setFiles}
        setPreviews={setPreviews}
      />
    </div>
  );
};

// ==================== ANIMATION STYLES ====================
const styles = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default DashboardPage;