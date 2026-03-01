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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// Define types
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

// Dropdown Menu Component
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

// Move Modal Component
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

// Upload Modal Component
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

// Create Album Modal Component
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

// Create Folder Modal Component
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

// Password Modal Component
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

// Edit Name Modal Component
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

// Media Modal Component
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

// Media Item Component
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

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [trashMedia, setTrashMedia] = useState<UploadedMedia[]>([]);
  const [lockedMedia, setLockedMedia] = useState<UploadedMedia[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
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
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalVideos: 0,
    totalImages: 0,
    totalAlbums: 0,
    totalStorage: 0
  });
  const [showCreateAlbum, setShowCreateAlbum] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>("");
  const [newAlbumDescription, setNewAlbumDescription] = useState<string>("");
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [nestedAlbums, setNestedAlbums] = useState<Album[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number>(-1);
  const [allDisplayMedia, setAllDisplayMedia] = useState<UploadedMedia[]>([]);
  const [showMobileSearch, setShowMobileSearch] = useState<boolean>(false);
  const [mobileItemMenu, setMobileItemMenu] = useState<string | null>(null);
  const [sessionExpiryTime, setSessionExpiryTime] = useState<Date | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Add axios interceptor for token refresh
  useEffect(() => {
    let isRefreshing = false;
    let failedQueue: any[] = [];

    const processQueue = (error: any, token: string | null = null) => {
      failedQueue.forEach(prom => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        if (originalRequest.url.includes('/auth/refresh')) {
          router.push("/login");
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return axios(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            withCredentials: true
          });
          
          processQueue(null);
          return axios(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          toast.error('Session expired. Please login again.');
          router.push("/login");
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router]);

  // Check session expiry
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='));
        if (token) {
          const tokenValue = token.split('=')[1];
          const base64Url = tokenValue.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          const expiryDate = new Date(payload.exp * 1000);
          setSessionExpiryTime(expiryDate);
          
          const timeUntilExpiry = expiryDate.getTime() - Date.now();
          if (timeUntilExpiry > 0 && timeUntilExpiry < 2 * 60 * 1000) {
            setShowSessionWarning(true);
          } else {
            setShowSessionWarning(false);
          }
        }
      } catch (error) {
        console.error("Failed to decode token", error);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, []);

  // Close mobile search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowMobileSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // File previews
  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      return;
    }

    const objectUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(objectUrls);

    return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  // Check locked access on mount
  useEffect(() => {
    checkLockedStatus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activityCheckRef.current) clearInterval(activityCheckRef.current);
    };
  }, []);

  // Update user storage
  const updateUserStorage = (storageData: { used: number; total: number; percentage: number }) => {
    setUser(prev => prev ? {
      ...prev,
      storageUsed: storageData.used,
      storageTotal: storageData.total
    } : null);
  };

  // Fetch storage info with error handling
  const fetchStorageInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/media/storage`, {
        withCredentials: true
      }).catch(err => {
        console.error('Storage fetch error:', err);
        return { data: { used: 0, total: 15 * 1024 * 1024 * 1024, percentage: 0 } };
      });
      
      updateUserStorage(res.data);
    } catch (err) {
      console.error('Failed to fetch storage:', err);
      setUser(prev => prev ? {
        ...prev,
        storageUsed: 0,
        storageTotal: 15 * 1024 * 1024 * 1024
      } : null);
    }
  };

  // Periodic storage update
  useEffect(() => {
    fetchStorageInfo();
    const interval = setInterval(fetchStorageInfo, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkAccessExpiration = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/locked/check-access`, {
        withCredentials: true
      });
      
      if (!res.data.hasAccess) {
        setHasLockedAccess(false);
        if (selectedCategory === "Locked") {
          setSelectedCategory("For You");
          toast.error('Locked folder access expired');
        }
        setShowTimer(false);
      } else {
        setShowTimer(true);
      }
    } catch (err) {
      console.error('Access check failed:', err);
    }
  };

  const refreshAccess = async () => {
    try {
      await axios.post(`${API_BASE_URL}/locked/refresh-access`, {}, {
        withCredentials: true
      });
    } catch (err) {
      console.error('Failed to refresh access:', err);
    }
  };

  const checkLockedStatus = async () => {
    try {
      const passwordRes = await axios.get(`${API_BASE_URL}/locked/has-password`, {
        withCredentials: true
      }).catch(() => ({ data: { hasPassword: false } }));
      setHasLockPassword(passwordRes.data.hasPassword);

      const accessRes = await axios.get(`${API_BASE_URL}/locked/check-access`, {
        withCredentials: true
      }).catch(() => ({ data: { hasAccess: false } }));
      setHasLockedAccess(accessRes.data.hasAccess);
    } catch (err) {
      console.error('Locked status check failed:', err);
    }
  };

  const fetchAlbumTree = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/albums/all`, {
        withCredentials: true
      }).catch(() => ({ data: [] }));
      
      const albumsWithFolders = res.data.map((a: any) => ({
        ...a,
        isFolder: a.isFolder || false
      }));
      
      setAlbumTree(albumsWithFolders);
    } catch (err) {
      console.error('Failed to fetch album tree:', err);
    }
  }, []);

  const moveMediaToAlbum = async (mediaId: string, targetAlbumId: string | null) => {
    const moveToast = toast.loading('Moving item...');

    try {
      const res = await axios.post(
        `${API_BASE_URL}/albums/move-media`,
        { mediaId, targetAlbumId },
        { withCredentials: true }
      );

      const updatedMedia = res.data.media;
      
      setMedia(prev => prev.map(item => 
        item._id === mediaId ? updatedMedia : item
      ));
      
      if (hasLockedAccess) {
        setLockedMedia(prev => prev.map(item => 
          item._id === mediaId ? updatedMedia : item
        ));
      }

      if (selectedAlbum && updatedMedia.albumId !== selectedAlbum._id) {
        if (selectedCategory === "Locked") {
          setLockedMedia(prev => prev.filter(item => item._id !== mediaId));
        } else {
          setMedia(prev => prev.filter(item => item._id !== mediaId));
        }
      }

      toast.success(res.data.message, { id: moveToast });
      setShowMoveModal(false);
      setMediaToMove(null);
      setSelectedTargetAlbum(null);
      setCurrentFolderPath([]);
      
      fetchData();
    } catch (err: any) {
      console.error('Move error:', err);
      toast.error(err.response?.data?.error || 'Failed to move item', { id: moveToast });
    }
  };

  const fetchData = useCallback(async () => {
    setError(null);
    
    try {
      const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
        withCredentials: true
      }).catch(err => {
        console.error("Auth me error:", err);
        if (err.response?.status === 401) {
          router.push("/login");
        }
        throw err;
      });
      
      if (!userRes.data.user) {
        router.push("/login");
        return;
      }

      setUser(userRes.data.user);

      const [mediaRes, trashRes, albumsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/media`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/media/trash/all`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/albums/all`, { withCredentials: true }).catch(() => ({ data: [] }))
      ]);

      console.log("📁 Media from API:", mediaRes.data);
      setMedia(mediaRes.data);
      setTrashMedia(trashRes.data);

      const albumsWithFolderFlag = albumsRes.data.map((a: any) => ({
        ...a,
        isFolder: true,
        color: a.color || '#3B82F6'
      }));
      setAlbums(albumsWithFolderFlag);

      if (hasLockedAccess) {
        try {
          const lockedRes = await axios.get(`${API_BASE_URL}/media/locked/all`, {
            withCredentials: true
          }).catch(() => ({ data: [] }));
          setLockedMedia(lockedRes.data);
        } catch (lockedErr) {
          console.error("Error fetching locked media:", lockedErr);
          setLockedMedia([]);
        }
      }

      setLoading(false);
      
    } catch (err: any) {
      console.error("Auth error:", err);
      
      if (err.response?.status === 401) {
        router.push("/login");
        return;
      }
      
      setError(err.response?.data?.error || "Failed to load data");
      setLoading(false);
    }
  }, [router, hasLockedAccess]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Timer for access expiration
  useEffect(() => {
    if (hasLockedAccess) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        checkAccessExpiration();
      }, 1000);

      if (activityCheckRef.current) clearInterval(activityCheckRef.current);
      activityCheckRef.current = setInterval(() => {
        if (selectedCategory === "Locked") {
          refreshAccess();
        }
      }, 4 * 60 * 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activityCheckRef.current) clearInterval(activityCheckRef.current);
      setShowTimer(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activityCheckRef.current) clearInterval(activityCheckRef.current);
    };
  }, [hasLockedAccess, selectedCategory]);

  // Update stats
  useEffect(() => {
    const allMedia = [...media, ...trashMedia, ...(hasLockedAccess ? lockedMedia : [])];
    setStats({
      totalItems: allMedia.length,
      totalVideos: allMedia.filter(m => m.type === 'video').length,
      totalImages: allMedia.filter(m => m.type === 'image').length,
      totalAlbums: albums.length,
      totalStorage: allMedia.reduce((acc, m) => acc + (m.size || 0), 0)
    });
  }, [media, trashMedia, lockedMedia, albums, hasLockedAccess]);

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
      console.log(`📁 For You view: Showing ${filtered.length} files not in any folder`);
    } else if (selectedCategory === "Albums") {
      filtered = [];
    } else {
      filtered = media;
    }

    if (selectedAlbum) {
      console.log(`📁 Filtering media for folder: ${selectedAlbum.name} (${selectedAlbum._id})`);
      filtered = media.filter(item => item.albumId === selectedAlbum._id);
      console.log(`📁 Media after filter: ${filtered.length} items in folder`);
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

  const handlePreviousMedia = () => {
    if (currentMediaIndex > 0) {
      const newIndex = currentMediaIndex - 1;
      setCurrentMediaIndex(newIndex);
      setSelectedMedia(allDisplayMedia[newIndex]);
      setNewName(allDisplayMedia[newIndex].originalName);
    }
  };

  const handleNextMedia = () => {
    if (currentMediaIndex < allDisplayMedia.length - 1) {
      const newIndex = currentMediaIndex + 1;
      setCurrentMediaIndex(newIndex);
      setSelectedMedia(allDisplayMedia[newIndex]);
      setNewName(allDisplayMedia[newIndex].originalName);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error("Please select files to upload.");
      return;
    }

    const totalUploadSize = files.reduce((acc, f) => acc + f.size, 0);
    if (user && (user.storageUsed + totalUploadSize) > user.storageTotal) {
      toast.error("Not enough storage space!");
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    if (selectedAlbum) {
      console.log(`📁 Uploading to folder: ${selectedAlbum.name} (${selectedAlbum._id})`);
      formData.append("albumId", selectedAlbum._id);
    } else {
      console.log("📁 Uploading to main library (no folder)");
    }

    const uploadToast = toast.loading(`Preparing to upload ${files.length} files...`);

    try {
      const fileProgress: { [key: string]: number } = {};
      files.forEach((file, index) => {
        fileProgress[`file-${index}`] = 0;
      });

      const res = await axios.post(
        `${API_BASE_URL}/media/upload`,
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const totalPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              
              const loadedPerFile = progressEvent.loaded / files.length;
              files.forEach((_, index) => {
                const fileLoaded = Math.min(loadedPerFile * (index + 1), files[index]?.size || 0);
                const filePercent = Math.min(100, Math.round((fileLoaded / (files[index]?.size || 1)) * 100));
                fileProgress[`file-${index}`] = filePercent;
              });

              setUploadProgress({ 
                overall: totalPercent,
                ...fileProgress
              });
              
              const completedFiles = Object.values(fileProgress).filter(p => p === 100).length;
              toast.loading(
                `Uploading: ${totalPercent}% complete | ${completedFiles}/${files.length} files done`, 
                { id: uploadToast }
              );
            }
          }
        }
      );

      console.log("✅ Upload response:", res.data);

      const uploadedMedia = res.data.media;
      
      if (!uploadedMedia || uploadedMedia.length === 0) {
        throw new Error("No media returned from server");
      }

      console.log("📁 Uploaded files albumId:", uploadedMedia[0]?.albumId);

      setMedia(prev => [...uploadedMedia, ...prev]);
      
      if (selectedAlbum) {
        setAlbums(prev => prev.map(album => {
          if (album._id === selectedAlbum._id) {
            return {
              ...album,
              media: [...uploadedMedia, ...(album.media || [])]
            };
          }
          return album;
        }));
        
        setNestedAlbums(prev => prev.map(album => {
          if (album._id === selectedAlbum._id) {
            return {
              ...album,
              media: [...uploadedMedia, ...(album.media || [])]
            };
          }
          return album;
        }));

        toast.success(`✅ Successfully uploaded ${uploadedMedia.length} files to "${selectedAlbum.name}"!`, { id: uploadToast });
      } else {
        toast.success(`✅ Successfully uploaded ${uploadedMedia.length} files to main library!`, { id: uploadToast });
      }
      
      // Fetch updated storage info
      fetchStorageInfo();
      
      setShowUploadModal(false);
      setFiles([]);
      setPreviews([]);
      
      setTimeout(() => {
        fetchData();
      }, 500);
      
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      
      toast.error(err.response?.data?.error || "Upload failed", { id: uploadToast });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAlbumName || !user) return;

    const createToast = toast.loading('Creating album...');

    try {
      const res = await axios.post(
        `${API_BASE_URL}/albums/create`,
        {
          name: newAlbumName,
          description: newAlbumDescription,
          category: "personal",
          parentAlbumId: null,
          isFolder: false,
        },
        { withCredentials: true }
      );

      const newAlbum = { ...res.data, isFolder: true };
      setAlbums((prev) => [...prev, newAlbum]);
      
      toast.success('Album created!', { id: createToast });
      setShowCreateAlbum(false);
      setNewAlbumName("");
      setNewAlbumDescription("");
    } catch (err: any) {
      console.error("Album creation error:", err);
      toast.error(err.response?.data?.error || "Failed to create album", { id: createToast });
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFolderName || !user || !selectedAlbum) return;

    const createToast = toast.loading('Creating folder...');

    try {
      const res = await axios.post(
        `${API_BASE_URL}/albums/create`,
        {
          name: newFolderName,
          description: "",
          category: "personal",
          parentAlbumId: selectedAlbum._id,
          isFolder: true,
        },
        { withCredentials: true }
      );

      const newFolder = { ...res.data, isFolder: true };
      setAlbums((prev) => [...prev, newFolder]);
      setNestedAlbums(prev => [...prev, newFolder]);
      
      toast.success('Folder created!', { id: createToast });
      setShowCreateFolderModal(false);
      setNewFolderName("");
    } catch (err: any) {
      console.error("Folder creation error:", err);
      toast.error(err.response?.data?.error || "Failed to create folder", { id: createToast });
    }
  };

  const navigateToAlbum = (album: Album) => {
    setAlbumPath(prev => [...prev, album]);
    setSelectedAlbum(album);
    setSelectedCategory("Albums");
    fetchData();
  };

  const navigateToFolder = (folder: Album) => {
    console.log(`📁 Navigating to folder:`, folder);
    setAlbumPath(prev => [...prev, folder]);
    setSelectedAlbum(folder);
    fetchData();
  };

  const navigateBack = () => {
    if (albumPath.length > 1) {
      const newPath = [...albumPath];
      newPath.pop();
      setAlbumPath(newPath);
      setSelectedAlbum(newPath[newPath.length - 1]);
    } else {
      setAlbumPath([]);
      setSelectedAlbum(null);
    }
    fetchData();
  };

  const goToAlbumsRoot = () => {
    setAlbumPath([]);
    setSelectedAlbum(null);
    fetchData();
  };

  const fetchFolderContents = async (folderId: string) => {
    try {
      console.log(`📁 Fetching contents for folder: ${folderId}`);
      
      const foldersRes = await axios.get(`${API_BASE_URL}/albums/?parentId=${folderId}`, {
        withCredentials: true
      }).catch(() => ({ data: [] }));
      setNestedAlbums(foldersRes.data);
      
      const folderRes = await axios.get(`${API_BASE_URL}/albums/${folderId}`, {
        withCredentials: true
      }).catch(() => ({ data: { media: [] } }));
      
      console.log(`📁 Folder data:`, folderRes.data);
      console.log(`📁 Media in folder from API:`, folderRes.data.media?.length || 0);
      
    } catch (err) {
      console.error("Error fetching folder contents:", err);
    }
  };

  const fetchBreadcrumb = async (folderId: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/albums/${folderId}/path`, {
        withCredentials: true
      }).catch(() => ({ data: [] }));
      setBreadcrumb(res.data);
    } catch (err) {
      console.error("Error fetching breadcrumb:", err);
    }
  };

  useEffect(() => {
    if (selectedAlbum) {
      fetchFolderContents(selectedAlbum._id);
      fetchBreadcrumb(selectedAlbum._id);
    } else {
      setNestedAlbums([]);
      setBreadcrumb([]);
    }
  }, [selectedAlbum]);

  const toggleFavorite = async (mediaId: string) => {
    const favToast = toast.loading('Updating...');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/media/${mediaId}/favorite`,
        {},
        { withCredentials: true }
      );

      setMedia((prev) =>
        prev.map((item) =>
          item._id === mediaId ? { ...item, favorite: response.data.favorite } : item
        )
      );

      if (selectedCategory === "Locked") {
        setLockedMedia((prev) =>
          prev.map((item) =>
            item._id === mediaId ? { ...item, favorite: response.data.favorite } : item
          )
        );
      }

      if (selectedMedia && selectedMedia._id === mediaId) {
        setSelectedMedia(prev => prev ? { ...prev, favorite: response.data.favorite } : null);
      }

      toast.success(response.data.message, { id: favToast });
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      toast.error("Failed to update", { id: favToast });
    }
  };

  const moveToTrash = async (id: string) => {
    const trashToast = toast.loading('Moving to trash...');

    try {
      const res = await axios.post(`${API_BASE_URL}/media/${id}/trash`, {}, {
        withCredentials: true
      });

      const item = media.find(m => m._id === id) || lockedMedia.find(m => m._id === id);
      
      if (item) {
        if (selectedCategory === "Locked") {
          setLockedMedia(prev => prev.filter(m => m._id !== id));
        } else {
          setMedia(prev => prev.filter(m => m._id !== id));
        }
        
        setTrashMedia(prev => [{
          ...item,
          trashedAt: new Date().toISOString(),
          scheduledDeleteAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          daysLeft: 15
        }, ...prev]);

        if (res.data.storage) {
          updateUserStorage(res.data.storage);
        }
      }
      
      toast.success('Moved to trash', { id: trashToast });
      setShowMediaModal(false);
      setShowMediaSidePanel(false);
      setSelectedMedia(null);
      setMobileItemMenu(null);
    } catch (err) {
      console.error("Trash error:", err);
      toast.error('Failed to move to trash', { id: trashToast });
    }
  };

  const restoreFromTrash = async (id: string) => {
    const restoreToast = toast.loading('Restoring...');

    try {
      const res = await axios.post(`${API_BASE_URL}/media/${id}/restore`, {}, {
        withCredentials: true
      });

      const item = trashMedia.find(m => m._id === id);
      setTrashMedia(prev => prev.filter(m => m._id !== id));
      
      if (item) {
        if (item.isLocked && hasLockedAccess) {
          setLockedMedia(prev => [{ ...item, isLocked: true }, ...prev]);
        } else {
          setMedia(prev => [{ ...item, isLocked: false }, ...prev]);
        }
        
        if (res.data.storage) {
          updateUserStorage(res.data.storage);
        }
      }
      
      toast.success('Restored', { id: restoreToast });
      setMobileItemMenu(null);
    } catch (err) {
      console.error("Restore error:", err);
      toast.error('Failed to restore', { id: restoreToast });
    }
  };

  const permanentDelete = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-3">
        <p className="text-white font-medium">Delete permanently?</p>
        <p className="text-gray-400 text-sm">This action cannot be undone.</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleteToast = toast.loading('Deleting permanently...');
              
              try {
                const res = await axios.delete(`${API_BASE_URL}/media/permanent/${id}`, {
                  withCredentials: true
                });

                setTrashMedia(prev => prev.filter(m => m._id !== id));
                
                if (res.data.storage) {
                  updateUserStorage(res.data.storage);
                }
                
                toast.success('Permanently deleted', { id: deleteToast });
                setMobileItemMenu(null);
              } catch (err) {
                console.error("Permanent delete error:", err);
                toast.error('Failed to delete', { id: deleteToast });
              }
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
  };

  const handleEditName = async () => {
    if (!selectedMedia || !newName.trim()) return;

    const editToast = toast.loading('Updating name...');

    try {
      await axios.put(
        `${API_BASE_URL}/media/${selectedMedia._id}`,
        { originalName: newName },
        { withCredentials: true }
      );

      if (selectedCategory === "Locked") {
        setLockedMedia(prev => prev.map(item => 
          item._id === selectedMedia._id ? { ...item, originalName: newName } : item
        ));
      } else {
        setMedia(prev => prev.map(item => 
          item._id === selectedMedia._id ? { ...item, originalName: newName } : item
        ));
      }

      setSelectedMedia(prev => prev ? { ...prev, originalName: newName } : null);
      
      toast.success('Name updated!', { id: editToast });
      setShowEditNameModal(false);
    } catch (err) {
      console.error("Edit name error:", err);
      toast.error('Failed to update name', { id: editToast });
    }
  };

  const bulkTrash = async () => {
    if (selectedItems.length === 0) return;
    
    const bulkToast = toast.loading(`Moving ${selectedItems.length} items to trash...`);
    
    try {
      const res = await axios.post(`${API_BASE_URL}/media/bulk-trash`,
        { mediaIds: selectedItems },
        { withCredentials: true }
      );
      
      const itemsToTrash = [...media, ...lockedMedia].filter(item => selectedItems.includes(item._id));
      
      if (selectedCategory === "Locked") {
        setLockedMedia(prev => prev.filter(item => !selectedItems.includes(item._id)));
      } else {
        setMedia(prev => prev.filter(item => !selectedItems.includes(item._id)));
      }
      
      setTrashMedia(prev => [
        ...itemsToTrash.map(item => ({
          ...item,
          trashedAt: new Date().toISOString(),
          scheduledDeleteAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          daysLeft: 15
        })),
        ...prev
      ]);
      
      if (res.data.storage) {
        updateUserStorage(res.data.storage);
      }
      
      setSelectedItems([]);
      setShowBulkActions(false);
      setIsSelectionMode(false);
      
      toast.success(`Moved ${selectedItems.length} items to trash`, { id: bulkToast });
    } catch (err) {
      console.error("Bulk trash error:", err);
      toast.error('Failed to move items', { id: bulkToast });
    }
  };

  const bulkRestore = async () => {
    if (selectedItems.length === 0) return;
    
    const bulkToast = toast.loading(`Restoring ${selectedItems.length} items...`);
    
    try {
      const res = await axios.post(`${API_BASE_URL}/media/bulk-restore`,
        { mediaIds: selectedItems },
        { withCredentials: true }
      );
      
      const itemsToRestore = trashMedia.filter(item => selectedItems.includes(item._id));
      setTrashMedia(prev => prev.filter(item => !selectedItems.includes(item._id)));
      
      const lockedItems = itemsToRestore.filter(item => item.isLocked);
      const normalItems = itemsToRestore.filter(item => !item.isLocked);
      
      if (hasLockedAccess) {
        setLockedMedia(prev => [...lockedItems.map(item => ({ ...item, isLocked: true })), ...prev]);
      }
      setMedia(prev => [...normalItems.map(item => ({ ...item, isLocked: false })), ...prev]);
      
      if (res.data.storage) {
        updateUserStorage(res.data.storage);
      }
      
      setSelectedItems([]);
      setShowBulkActions(false);
      setIsSelectionMode(false);
      
      toast.success(`Restored ${selectedItems.length} items`, { id: bulkToast });
    } catch (err) {
      console.error("Bulk restore error:", err);
      toast.error('Failed to restore items', { id: bulkToast });
    }
  };

  const bulkPermanentDelete = async () => {
    if (selectedItems.length === 0) return;
    
    toast((t) => (
      <div className="flex flex-col items-center gap-3">
        <p className="text-white font-medium">Delete {selectedItems.length} items?</p>
        <p className="text-gray-400 text-sm">This action cannot be undone.</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const bulkToast = toast.loading(`Deleting ${selectedItems.length} items permanently...`);
              
              try {
                await Promise.all(selectedItems.map(id => 
                  axios.delete(`${API_BASE_URL}/media/permanent/${id}`, { withCredentials: true })
                ));
                
                setTrashMedia(prev => prev.filter(item => !selectedItems.includes(item._id)));
                
                setSelectedItems([]);
                setShowBulkActions(false);
                setIsSelectionMode(false);
                
                toast.success(`Deleted ${selectedItems.length} items permanently`, { id: bulkToast });
              } catch (err) {
                console.error("Bulk permanent delete error:", err);
                toast.error('Failed to delete items', { id: bulkToast });
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
          >
            Delete All
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
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockState.password !== lockState.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (lockState.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsSettingPassword(true);
    setPasswordError('');

    try {
      await axios.post(`${API_BASE_URL}/locked/set-password`,
        { password: lockState.password },
        { withCredentials: true }
      );
      
      toast.success('Password set successfully!');
      setHasLockPassword(true);
      setHasLockedAccess(true);
      setLockState({
        isLocked: false,
        password: '',
        confirmPassword: '',
        showPassword: false,
        showConfirmPassword: false
      });
      setShowPasswordModal(false);
      
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to set password');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lockPassword) {
      setPasswordError('Please enter password');
      return;
    }

    setIsSettingPassword(true);
    setPasswordError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/locked/verify-password`,
        { password: lockPassword },
        { withCredentials: true }
      );
      
      if (res.data.valid) {
        toast.success('Access granted for 5 minutes!');
        setHasLockedAccess(true);
        setShowPasswordModal(false);
        setLockPassword('');
        setSelectedCategory('Locked');
        fetchData();
      }
      
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Invalid password');
    } finally {
      setIsSettingPassword(false);
    }
  };

  const toggleLock = async (id: string) => {
    if (!hasLockedAccess) {
      setShowPasswordModal(true);
      return;
    }

    const lockToast = toast.loading('Moving to locked folder...');

    try {
      const res = await axios.post(`${API_BASE_URL}/media/${id}/lock`, {}, {
        withCredentials: true
      });

      const item = media.find(m => m._id === id);
      
      if (item) {
        setMedia(prev => prev.filter(m => m._id !== id));
        setLockedMedia(prev => [{ ...item, isLocked: true }, ...prev]);
        
        toast.success('Moved to locked folder', { id: lockToast });
      }

      if (selectedMedia && selectedMedia._id === id) {
        setSelectedMedia(prev => prev ? { ...prev, isLocked: true } : null);
      }
      
      if (res.data.storage) {
        updateUserStorage(res.data.storage);
      }
      
      setMobileItemMenu(null);
    } catch (err) {
      console.error("Lock error:", err);
      toast.error('Failed to move to locked folder', { id: lockToast });
    }
  };

  const moveToOriginal = async (id: string) => {
    const unlockToast = toast.loading('Moving to main library...');

    try {
      const res = await axios.post(`${API_BASE_URL}/media/${id}/lock`, {}, {
        withCredentials: true
      });

      const item = lockedMedia.find(m => m._id === id);
      
      if (item) {
        setLockedMedia(prev => prev.filter(m => m._id !== id));
        setMedia(prev => [{ ...item, isLocked: false }, ...prev]);
        
        toast.success('Moved to main library', { id: unlockToast });
      }

      if (selectedMedia && selectedMedia._id === id) {
        setSelectedMedia(prev => prev ? { ...prev, isLocked: false } : null);
      }
      
      if (res.data.storage) {
        updateUserStorage(res.data.storage);
      }
      
      setMobileItemMenu(null);
    } catch (err) {
      console.error("Unlock error:", err);
      toast.error('Failed to move to main library', { id: unlockToast });
    }
  };

  const handleMoveToAlbum = (mediaId: string) => {
    setMediaToMove(mediaId);
    fetchAlbumTree();
    setShowMoveModal(true);
    setCurrentFolderPath([]);
    setSelectedTargetAlbum(null);
  };

  const clearLockedAccess = async () => {
    try {
      await axios.post(`${API_BASE_URL}/locked/clear-access`, {}, {
        withCredentials: true
      });
      setHasLockedAccess(false);
      if (selectedCategory === "Locked") {
        setSelectedCategory("For You");
      }
      toast.success('Locked folder locked');
    } catch (err) {
      console.error("Clear access error:", err);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-3">
        <p className="text-white font-medium">Delete Album?</p>
        <p className="text-gray-400 text-sm">The media inside will not be deleted.</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleteToast = toast.loading('Deleting album...');

              try {
                await axios.delete(
                  `${API_BASE_URL}/albums/${albumId}`,
                  { withCredentials: true }
                );

                setAlbums((prev) => prev.filter((a) => a._id !== albumId));
                
                if (selectedAlbum?._id === albumId) {
                  setSelectedAlbum(null);
                  setAlbumPath([]);
                }
                
                toast.success('Album deleted', { id: deleteToast });
              } catch (err) {
                console.error("Album delete error:", err);
                toast.error('Failed to delete album', { id: deleteToast });
              }
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
  };

  const handleDeleteFolder = async (folderId: string) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-3">
        <p className="text-white font-medium">Delete Folder?</p>
        <p className="text-gray-400 text-sm">All contents will be deleted permanently.</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleteToast = toast.loading('Deleting folder...');

              try {
                await axios.delete(
                  `${API_BASE_URL}/albums/${folderId}`,
                  { withCredentials: true }
                );

                setAlbums((prev) => prev.filter((a) => a._id !== folderId));
                setNestedAlbums((prev) => prev.filter((a) => a._id !== folderId));
                
                toast.success('Folder deleted', { id: deleteToast });
              } catch (err) {
                console.error("Folder delete error:", err);
                toast.error('Failed to delete folder', { id: deleteToast });
              }
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
  };

  const goToSettings = () => {
    router.push('/settings');
  };

  const handleLogout = async () => {
    const logoutToast = toast.loading('Logging out...');
    
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
      toast.success('Logged out', { id: logoutToast });
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error('Logout failed', { id: logoutToast });
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === displayMedia.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(displayMedia.map(item => item._id));
    }
  };

  const toggleFullscreen = (element: HTMLElement) => {
    if (!document.fullscreenElement) {
      element.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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

  const handleMediaClick = (item: UploadedMedia) => {
    const index = allDisplayMedia.findIndex(m => m._id === item._id);
    setCurrentMediaIndex(index);
    setSelectedMedia(item);
    setNewName(item.originalName);
    setShowMediaModal(true);
    setShowMediaSidePanel(false);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
    setMobileItemMenu(null);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedItems([]);
    }
    setMobileItemMenu(null);
  };

  const handleMobileItemMenu = (id: string) => {
    setMobileItemMenu(mobileItemMenu === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl text-white font-light">Loading your gallery...</h2>
        </div>
      </div>
    );
  }

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
      
      {showSessionWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-xl shadow-lg z-50 flex items-center space-x-3">
          <Clock size={16} />
          <span className="text-sm">Your session will expire in 2 minutes. Please save your work.</span>
          <button
            onClick={async () => {
              try {
                await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                setShowSessionWarning(false);
                toast.success('Session extended!');
              } catch (error) {
                console.error("Failed to refresh session", error);
              }
            }}
            className="ml-2 px-2 py-1 bg-white text-yellow-600 rounded-lg text-xs font-medium hover:bg-yellow-50 transition"
          >
            Extend
          </button>
        </div>
      )}
      
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-30 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left section - Hamburger menu */}
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
            {hasLockedAccess && showTimer && (
              <div className="hidden sm:flex px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-xl text-sm items-center space-x-2">
                <Clock size={14} />
                <span>5 min session</span>
              </div>
            )}
            
            {/* Mobile search icon */}
            <div className="relative md:hidden">
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="p-2 hover:bg-gray-800 rounded-xl transition"
              >
                <Search size={20} className="text-gray-400" />
              </button>
              
              {showMobileSearch && (
                <div 
                  ref={mobileSearchRef}
                  className="absolute right-2/2 translate-x-1/2 top-full mt-2 w-72 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-3 z-50"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                      autoFocus
                    />
                  </div>
                  {searchQuery && (
                    <div className="mt-2 text-xs text-gray-400 px-2">
                      Found {displayMedia.length} results
                    </div>
                  )}
                  <button
                    onClick={() => setShowMobileSearch(false)}
                    className="absolute top-2 right-2 p-1 hover:bg-gray-800 rounded-lg transition"
                  >
                    <X size={14} className="text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            {/* Three dot menu */}
            <DropdownMenu
              trigger={
                <button className="p-2 hover:bg-gray-800 rounded-xl transition">
                  <MoreVertical size={20} className="text-gray-400" />
                </button>
              }
              align="right"
              items={[
                {
                  label: isSelectionMode ? 'Exit Selection Mode' : 'Select Items',
                  icon: isSelectionMode ? <X size={16} /> : <CheckSquare size={16} />,
                  onClick: toggleSelectionMode
                },
                {
                  label: selectedItems.length === displayMedia.length ? 'Deselect All' : 'Select All',
                  icon: <Square size={16} />,
                  onClick: handleSelectAll
                }
              ]}
            />
            
            {/* Upload button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="p-2.5 hover:bg-gray-800 rounded-xl transition relative group"
              title="Upload"
            >
              <Upload size={20} className="text-gray-400 group-hover:text-white" />
            </button>

            {/* User menu - Desktop with Google Picture */}
            <div className="relative hidden md:block">
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
                      onError={(e) => {
                        console.log('Google picture failed to load, showing fallback');
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-medium text-lg';
                          fallback.textContent = user?.name?.charAt(0)?.toUpperCase() || 'U';
                          parent.appendChild(fallback);
                        }
                      }}
                      onLoad={() => console.log('Google picture loaded successfully')}
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-medium text-lg shadow-lg group-hover:shadow-blue-500/20 transition-all">
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
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        {user?.auth_provider === 'google' && (
                          <span className="text-xs text-blue-400 flex items-center mt-1">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                            </svg>
                            Google
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-2 py-2">
                    <button 
                      onClick={goToSettings}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-xl flex items-center space-x-3 text-sm text-gray-300 transition"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <button 
                      onClick={() => toast.success('Help & Support coming soon!')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-xl flex items-center space-x-3 text-sm text-gray-300 transition"
                    >
                      <HelpCircle size={16} />
                      <span>Help & Support</span>
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

      {/* Mobile Left Side Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900 shadow-xl overflow-y-auto animate-slide-right">
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-medium text-white">Menu</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-xl transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* User info with Google Picture */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                {user?.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-500/50">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-xl';
                          fallback.textContent = user?.name?.charAt(0)?.toUpperCase() || 'U';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  {user?.auth_provider === 'google' && (
                    <span className="text-xs text-blue-400 mt-1 inline-block">Google</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile categories */}
            <div className="p-4">
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => {
                      if (category.name === "Locked") {
                        if (!hasLockedAccess) {
                          setShowPasswordModal(true);
                        } else {
                          setSelectedCategory(category.name);
                          setSelectedAlbum(null);
                        }
                      } else {
                        setSelectedCategory(category.name);
                        setSelectedAlbum(null);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      selectedCategory === category.name
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <category.icon size={20} />
                    <span className="flex-1 text-sm font-medium text-left">{category.name}</span>
                    {category.name === "Locked" && hasLockedAccess && (
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    )}
                    {category.name === "Trash" && trashMedia.length > 0 && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                        {trashMedia.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Mobile settings and logout */}
              <div className="mt-8 pt-8 border-t border-gray-800 space-y-2">
                <button 
                  onClick={() => {
                    goToSettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-xl flex items-center space-x-3 text-sm text-gray-300"
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </button>
                <button 
                  onClick={() => {
                    toast.success('Help & Support coming soon!');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800 rounded-xl flex items-center space-x-3 text-sm text-gray-300"
                >
                  <HelpCircle size={20} />
                  <span>Help & Support</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 rounded-xl flex items-center space-x-3 text-sm"
                >
                  <LogOut size={20} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>

            {/* Mobile storage */}
            {user && (
              <div className="p-4 border-t border-gray-800">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-gray-500 flex items-center space-x-2">
                    <HardDrive size={14} />
                    <span>Storage</span>
                  </span>
                  <span className="text-white font-medium">
                    {formatFileSize(user.storageUsed)} / {formatFileSize(user.storageTotal)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                    style={{ width: `${(user.storageUsed / user.storageTotal) * 100}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex pt-20">
        {/* Left Sidebar - Desktop */}
        <aside className={`fixed left-0 top-20 h-[calc(100vh-5rem)] bg-black border-r border-gray-800 transition-all duration-300 overflow-y-auto z-20 hidden lg:block ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}>
          <div className="py-6 px-3">
            {/* Categories */}
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => {
                    if (category.name === "Locked") {
                      if (!hasLockedAccess) {
                        setShowPasswordModal(true);
                      } else {
                        setSelectedCategory(category.name);
                        setSelectedAlbum(null);
                      }
                    } else {
                      setSelectedCategory(category.name);
                      setSelectedAlbum(null);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    selectedCategory === category.name
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <category.icon size={20} />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-sm font-medium text-left">{category.name}</span>
                  )}
                  {category.name === "Locked" && hasLockedAccess && !sidebarCollapsed && (
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  )}
                  {category.name === "Trash" && trashMedia.length > 0 && !sidebarCollapsed && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                      {trashMedia.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Storage bar - Desktop */}
            {!sidebarCollapsed && user && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-800">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="text-gray-500 flex items-center space-x-2">
                    <HardDrive size={14} />
                    <span>Storage</span>
                  </span>
                  <span className="text-white font-medium">
                    {formatFileSize(user.storageUsed)} / {formatFileSize(user.storageTotal)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300" 
                    style={{ width: `${(user.storageUsed / user.storageTotal) * 100}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
          <div className="p-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {selectedAlbum ? selectedAlbum.name : selectedCategory}
                </h1>
                {selectedCategory === "Locked" && hasLockedAccess && (
                  <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span>5 min session</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedCategory === "Albums" && !selectedAlbum && (
                  <button
                    onClick={() => setShowCreateAlbum(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm flex items-center space-x-2"
                  >
                    <FolderPlus size={16} />
                    <span className="hidden sm:inline">New Album</span>
                    <span className="sm:hidden">New</span>
                  </button>
                )}
                {selectedAlbum && (
                  <>
                    <button
                      onClick={() => setShowCreateFolderModal(true)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition text-sm flex items-center space-x-2"
                    >
                      <FolderPlus size={16} />
                      <span className="hidden sm:inline">New Folder</span>
                      <span className="sm:hidden">New</span>
                    </button>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm flex items-center space-x-2"
                    >
                      <Upload size={16} />
                      <span className="hidden sm:inline">Upload to Folder</span>
                      <span className="sm:hidden">Upload</span>
                    </button>
                  </>
                )}
                <div className="flex items-center bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition"
                >
                  {sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
                </button>
              </div>
            </div>

            {/* Breadcrumb for albums */}
            {selectedAlbum && (
              <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 text-sm">
                <button
                  onClick={goToAlbumsRoot}
                  className="text-gray-500 hover:text-white whitespace-nowrap px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  <Home size={14} className="inline mr-1" />
                  Albums
                </button>
                
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={item._id}>
                    <ChevronRight size={14} className="text-gray-600" />
                    <button
                      onClick={async () => {
                        const res = await axios.get(`${API_BASE_URL}/albums/${item._id}`, {
                          withCredentials: true
                        });
                        setSelectedAlbum(res.data);
                      }}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-lg transition ${
                        index === breadcrumb.length - 1 
                          ? 'bg-blue-600/20 text-blue-400 font-medium' 
                          : 'text-gray-500 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Selection mode indicator */}
            {isSelectionMode && (
              <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600/30 rounded-xl flex items-center justify-between">
                <span className="text-blue-400 text-sm">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSelectAll}
                    className="text-blue-400 text-sm hover:text-blue-300"
                  >
                    {selectedItems.length === displayMedia.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={toggleSelectionMode}
                    className="text-blue-400 text-sm hover:text-blue-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Welcome banner */}
            {selectedCategory === "For You" && displayMedia.length === 0 && (
              <div className="mb-8 p-12 bg-gray-900 rounded-3xl border border-gray-800 text-center">
                <div className="inline-flex p-4 bg-blue-600 rounded-2xl mb-4">
                  <Sparkles size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to ImageLibrary</h3>
                <p className="text-gray-400 mb-6">Upload photos and videos to your main library</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm inline-flex items-center space-x-2"
                >
                  <Upload size={18} />
                  <span>Upload Now</span>
                </button>
              </div>
            )}

            {/* Locked folder message */}
            {selectedCategory === "Locked" && !hasLockedAccess && (
              <div className="mb-8 p-12 bg-gray-900 rounded-3xl border border-gray-800 text-center">
                <div className="inline-flex p-4 bg-blue-600 rounded-2xl mb-4">
                  <Lock size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Locked Folder</h3>
                <p className="text-gray-400 mb-6">
                  {hasLockPassword ? 'Enter password to access locked media' : 'Set a password to protect your private media'}
                </p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm inline-flex items-center space-x-2"
                >
                  <Key size={18} />
                  <span>{hasLockPassword ? 'Enter Password' : 'Set Password'}</span>
                </button>
              </div>
            )}

            {/* Albums View */}
            {selectedCategory === "Albums" && !selectedAlbum && (
              <div>
                {albums.filter(a => !a.parentAlbumId).length === 0 ? (
                  <div className="text-center py-16 bg-gray-900 rounded-3xl border border-gray-800">
                    <Folder size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">No albums yet. Create your first album!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {albums.filter(a => !a.parentAlbumId).map((album) => (
                      <div
                        key={album._id}
                        className="group cursor-pointer relative"
                      >
                        <div
                          onClick={() => navigateToAlbum(album)}
                          className="aspect-square bg-gray-900 rounded-2xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-blue-600 transition-all"
                        >
                          {album.coverUrl ? (
                            <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Folder size={40} className="text-gray-600" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm text-white font-medium truncate px-1">{album.name}</h3>
                        <p className="text-xs text-gray-500 px-1">{album.media?.length || 0} items</p>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAlbum(album._id);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Album Content View */}
            {selectedAlbum && (
              <div>
                {/* Nested Folders */}
                {nestedAlbums.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Folders</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {nestedAlbums.map((folder) => (
                        <div key={folder._id} className="relative group">
                          <div
                            onClick={() => navigateToFolder(folder)}
                            className="cursor-pointer"
                          >
                            <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden mb-2 border-2 border-gray-700 group-hover:border-blue-600 transition-all flex items-center justify-center">
                              <Folder size={48} className="text-blue-400" />
                            </div>
                            <h3 className="text-sm text-white font-medium truncate text-center">{folder.name}</h3>
                            <p className="text-xs text-gray-500 text-center">
                              {folder.media?.length || 0} items
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder._id);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media in folder */}
                {displayMedia.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Media ({displayMedia.length})
                    </h3>
                    <div className={viewMode === 'grid' 
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                      : "space-y-2"
                    }>
                      {displayMedia.map((item) => (
                        <MediaItem
                          key={item._id}
                          item={item}
                          viewMode={viewMode}
                          selectedCategory={selectedCategory}
                          selectedItems={selectedItems}
                          onToggleSelect={toggleItemSelection}
                          onClick={handleMediaClick}
                          onToggleFavorite={toggleFavorite}
                          onToggleLock={toggleLock}
                          onMoveToOriginal={moveToOriginal}
                          onMoveToTrash={moveToTrash}
                          onMoveToAlbum={handleMoveToAlbum}
                          onRestore={restoreFromTrash}
                          onPermanentDelete={permanentDelete}
                          formatFileSize={formatFileSize}
                          formatDate={formatDate}
                          isSelectionMode={isSelectionMode}
                          showMobileMenu={mobileItemMenu}
                          onMobileMenuToggle={handleMobileItemMenu}
                          currentAlbumId={selectedAlbum?._id}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-900 rounded-3xl border border-gray-800">
                    <Folder size={48} className="mx-auto text-gray-600 mb-3" />
                    <h3 className="text-xl font-medium text-white mb-2">This folder is empty</h3>
                    <p className="text-gray-400 mb-6">Upload files or create sub-folders</p>
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm inline-flex items-center space-x-2"
                      >
                        <Upload size={18} />
                        <span>Upload Files</span>
                      </button>
                      <button
                        onClick={() => setShowCreateFolderModal(true)}
                        className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition text-sm inline-flex items-center space-x-2"
                      >
                        <FolderPlus size={18} />
                        <span>New Folder</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other category views */}
            {selectedCategory !== "Albums" && !selectedAlbum && selectedCategory !== "Locked" && displayMedia.length > 0 && (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "space-y-2"
              }>
                {displayMedia.map((item) => (
                  <MediaItem
                    key={item._id}
                    item={item}
                    viewMode={viewMode}
                    selectedCategory={selectedCategory}
                    selectedItems={selectedItems}
                    onToggleSelect={toggleItemSelection}
                    onClick={handleMediaClick}
                    onToggleFavorite={toggleFavorite}
                    onToggleLock={toggleLock}
                    onMoveToOriginal={moveToOriginal}
                    onMoveToTrash={moveToTrash}
                    onMoveToAlbum={handleMoveToAlbum}
                    onRestore={restoreFromTrash}
                    onPermanentDelete={permanentDelete}
                    formatFileSize={formatFileSize}
                    formatDate={formatDate}
                    isSelectionMode={isSelectionMode}
                    showMobileMenu={mobileItemMenu}
                    onMobileMenuToggle={handleMobileItemMenu}
                  />
                ))}
              </div>
            )}

            {/* Locked category view */}
            {selectedCategory === "Locked" && hasLockedAccess && (
              <div>
                {lockedMedia.length === 0 ? (
                  <div className="text-center py-16 bg-gray-900 rounded-3xl border border-gray-800">
                    <Lock size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">No locked items</p>
                    <p className="text-xs text-gray-500 mt-2">Lock items from main library to see them here</p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "space-y-2"
                  }>
                    {lockedMedia.map((item) => (
                      <MediaItem
                        key={item._id}
                        item={item}
                        viewMode={viewMode}
                        selectedCategory={selectedCategory}
                        selectedItems={selectedItems}
                        onToggleSelect={toggleItemSelection}
                        onClick={handleMediaClick}
                        onToggleFavorite={toggleFavorite}
                        onToggleLock={toggleLock}
                        onMoveToOriginal={moveToOriginal}
                        onMoveToTrash={moveToTrash}
                        onMoveToAlbum={handleMoveToAlbum}
                        onRestore={restoreFromTrash}
                        onPermanentDelete={permanentDelete}
                        formatFileSize={formatFileSize}
                        formatDate={formatDate}
                        isSelectionMode={isSelectionMode}
                        showMobileMenu={mobileItemMenu}
                        onMobileMenuToggle={handleMobileItemMenu}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state messages */}
            {displayMedia.length === 0 && selectedCategory !== "For You" && selectedCategory !== "Albums" && selectedCategory !== "Locked" && (
              <div className="text-center py-16 bg-gray-900 rounded-3xl border border-gray-800">
                {selectedCategory === "Trash" && (
                  <>
                    <Trash2 size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">Trash is empty</p>
                  </>
                )}
                {selectedCategory === "Videos" && (
                  <>
                    <Video size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">No videos yet</p>
                  </>
                )}
                {selectedCategory === "Images" && (
                  <>
                    <ImageIcon size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">No images yet</p>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bulk actions bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-3 flex items-center space-x-3 z-40">
          <span className="px-3 text-sm text-white font-medium">{selectedItems.length} selected</span>
          
          {selectedCategory === "Trash" ? (
            <>
              <button
                onClick={bulkRestore}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm flex items-center space-x-2 transition"
              >
                <RotateCcw size={16} />
                <span className="hidden sm:inline">Restore</span>
              </button>
              <button
                onClick={bulkPermanentDelete}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm flex items-center space-x-2 transition"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          ) : selectedCategory === "Locked" ? (
            <>
              <button
                onClick={() => {
                  selectedItems.forEach(id => moveToOriginal(id));
                  setSelectedItems([]);
                }}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm flex items-center space-x-2 transition"
              >
                <Unlock size={16} />
                <span className="hidden sm:inline">Move to Main</span>
              </button>
              <button
                onClick={bulkTrash}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm flex items-center space-x-2 transition"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Move to Trash</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  selectedItems.forEach(id => toggleLock(id));
                  setSelectedItems([]);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm flex items-center space-x-2 transition"
              >
                <Lock size={16} />
                <span className="hidden sm:inline">Lock</span>
              </button>
              <button
                onClick={bulkTrash}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm flex items-center space-x-2 transition"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Move to Trash</span>
              </button>
            </>
          )}
          
          <button
            onClick={() => setSelectedItems([])}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mobile Item Menu */}
      {mobileItemMenu && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileItemMenu(null)}
        >
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-gray-800 p-4 animate-slide-up">
            <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-4"></div>
            
            {(() => {
              const item = allDisplayMedia.find(m => m._id === mobileItemMenu);
              if (!item) return null;

              return (
                <>
                  <div className="p-4 bg-gray-800/50 rounded-xl mb-4">
                    <h3 className="text-white font-medium mb-1">{item.originalName}</h3>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span>{formatFileSize(item.size)}</span>
                      <span>•</span>
                      <span>{formatDate(item.createdAt)}</span>
                      {item.isLocked && <Lock size={12} className="text-blue-400" />}
                      {item.favorite && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                      {item.albumId && <Folder size={12} className="text-blue-400" />}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedCategory === "Trash" ? (
                      <>
                        <button
                          onClick={() => {
                            restoreFromTrash(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <RotateCcw size={20} className="text-green-400" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => {
                            permanentDelete(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-red-400 transition"
                        >
                          <Trash2 size={20} />
                          <span>Delete permanently</span>
                        </button>
                      </>
                    ) : selectedCategory === "Locked" ? (
                      <>
                        <button
                          onClick={() => {
                            window.open(item.url, '_blank');
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <Download size={20} />
                          <span>Download</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedMedia(item);
                            setNewName(item.originalName);
                            setShowEditNameModal(true);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <Pencil size={20} />
                          <span>Edit name</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            toggleFavorite(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <Star size={20} className={item.favorite ? "text-yellow-400 fill-yellow-400" : ""} />
                          <span>{item.favorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            moveToOriginal(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <Unlock size={20} className="text-green-400" />
                          <span>Move to Main Library</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            moveToTrash(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-red-400 transition"
                        >
                          <Trash2 size={20} />
                          <span>Move to trash</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            window.open(item.url, '_blank');
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <Download size={20} />
                          <span>Download</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedMedia(item);
                            setNewName(item.originalName);
                            setShowEditNameModal(true);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <Pencil size={20} />
                          <span>Edit name</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            toggleFavorite(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <Star size={20} className={item.favorite ? "text-yellow-400 fill-yellow-400" : ""} />
                          <span>{item.favorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            handleMoveToAlbum(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <FolderPlus size={20} className="text-blue-400" />
                          <span>Move to Album/Folder</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            toggleLock(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-gray-300 transition"
                        >
                          <Lock size={20} />
                          <span>{item.isLocked ? 'Unlock' : 'Lock'}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            moveToTrash(item._id);
                            setMobileItemMenu(null);
                          }}
                          className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800 rounded-xl text-red-400 transition"
                        >
                          <Trash2 size={20} />
                          <span>Move to trash</span>
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setMobileItemMenu(null)}
                    className="w-full mt-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-white transition"
                  >
                    Close
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

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
        onFileSelect={handleFileSelect}
        onUpload={handleUpload}
        formatFileSize={formatFileSize}
        setFiles={setFiles}
        setPreviews={setPreviews}
        currentAlbumId={selectedAlbum?._id}
        currentAlbumName={selectedAlbum?.name}
      />

      <CreateAlbumModal
        show={showCreateAlbum}
        onClose={() => {
          setShowCreateAlbum(false);
          setNewAlbumName("");
          setNewAlbumDescription("");
        }}
        albumName={newAlbumName}
        albumDescription={newAlbumDescription}
        onNameChange={setNewAlbumName}
        onDescriptionChange={setNewAlbumDescription}
        onCreate={handleCreateAlbum}
      />

      <CreateFolderModal
        show={showCreateFolderModal}
        onClose={() => {
          setShowCreateFolderModal(false);
          setNewFolderName("");
        }}
        folderName={newFolderName}
        albumName={selectedAlbum?.name || ""}
        onNameChange={setNewFolderName}
        onCreate={handleCreateFolder}
        parentAlbumId={selectedAlbum?._id}
      />

      <PasswordModal
        show={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError('');
          setLockPassword('');
          setLockState({
            isLocked: false,
            password: '',
            confirmPassword: '',
            showPassword: false,
            showConfirmPassword: false
          });
        }}
        hasLockedAccess={hasLockedAccess}
        hasLockPassword={hasLockPassword}
        lockPassword={lockPassword}
        lockState={lockState}
        passwordError={passwordError}
        isSettingPassword={isSettingPassword}
        showLockPassword={showLockPassword}
        onLockPasswordChange={setLockPassword}
        onLockStateChange={setLockState}
        onShowLockPasswordChange={setShowLockPassword}
        onSetPassword={handleSetPassword}
        onVerifyPassword={handleVerifyPassword}
        timeLeft={accessTimeLeft}
      />

      <EditNameModal
        show={showEditNameModal}
        onClose={() => {
          setShowEditNameModal(false);
          setNewName("");
        }}
        currentName={newName}
        onNameChange={setNewName}
        onSave={handleEditName}
      />

      <MoveModal
        show={showMoveModal}
        onClose={() => {
          setShowMoveModal(false);
          setMediaToMove(null);
          setSelectedTargetAlbum(null);
          setCurrentFolderPath([]);
        }}
        albumTree={albumTree}
        currentFolderPath={currentFolderPath}
        setCurrentFolderPath={setCurrentFolderPath}
        selectedTargetAlbum={selectedTargetAlbum}
        setSelectedTargetAlbum={setSelectedTargetAlbum}
        onMove={(targetId) => {
          if (mediaToMove) {
            moveMediaToAlbum(mediaToMove, targetId);
          }
        }}
        isMoving={false}
      />

      {showMediaModal && selectedMedia && (
        <MediaModal
          media={selectedMedia}
          onClose={() => {
            setShowMediaModal(false);
            setShowMediaSidePanel(false);
            setSelectedMedia(null);
            setCurrentMediaIndex(-1);
          }}
          showSidePanel={showMediaSidePanel}
          onToggleSidePanel={() => setShowMediaSidePanel(!showMediaSidePanel)}
          selectedCategory={selectedCategory}
          onToggleFavorite={toggleFavorite}
          onToggleLock={toggleLock}
          onMoveToOriginal={moveToOriginal}
          onMoveToAlbum={handleMoveToAlbum}
          onMoveToTrash={moveToTrash}
          onRestore={restoreFromTrash}
          onPermanentDelete={permanentDelete}
          onEditName={() => {
            setShowEditNameModal(true);
            setShowMediaSidePanel(false);
          }}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
          toggleFullscreen={toggleFullscreen}
          onPrevious={handlePreviousMedia}
          onNext={handleNextMedia}
          hasPrevious={currentMediaIndex > 0}
          hasNext={currentMediaIndex < allDisplayMedia.length - 1}
          totalMedia={allDisplayMedia.length}
          currentIndex={currentMediaIndex + 1}
        />
      )}
    </div>
  );
};

// Add animation styles
const styles = `
  @keyframes slide-right {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

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

  .animate-slide-right {
    animation: slide-right 0.3s ease-out;
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
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