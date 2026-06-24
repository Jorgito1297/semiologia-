// ============================================================
// NEXUS VAULT — TypeScript Type Definitions
// ============================================================

// --- Enums ---
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN       = 'ADMIN',
  SUPERVISOR  = 'SUPERVISOR',
  INSTRUCTOR  = 'INSTRUCTOR',
  USER        = 'USER',
  STUDENT     = 'STUDENT',
}

export enum FileCategory {
  DOCUMENT  = 'DOCUMENT',
  IMAGE     = 'IMAGE',
  SPREADSHEET = 'SPREADSHEET',
  ARCHIVE   = 'ARCHIVE',
  VIDEO     = 'VIDEO',
  AUDIO     = 'AUDIO',
  OTHER     = 'OTHER',
}

export enum AuditAction {
  // Auth
  LOGIN           = 'LOGIN',
  LOGOUT          = 'LOGOUT',
  LOGIN_FAILED    = 'LOGIN_FAILED',
  TOKEN_REFRESH   = 'TOKEN_REFRESH',
  // File
  FILE_UPLOAD     = 'FILE_UPLOAD',
  FILE_DOWNLOAD   = 'FILE_DOWNLOAD',
  FILE_DELETE     = 'FILE_DELETE',
  FILE_SHARE      = 'FILE_SHARE',
  FILE_VIEW       = 'FILE_VIEW',
  FILE_RENAME     = 'FILE_RENAME',
  // Admin
  ROLE_CHANGE     = 'ROLE_CHANGE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  USER_ACTIVATE   = 'USER_ACTIVATE',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
  // Error
  UNAUTHORIZED    = 'UNAUTHORIZED',
  FORBIDDEN       = 'FORBIDDEN',
  RATE_LIMITED    = 'RATE_LIMITED',
}

export enum AuditCategory {
  AUTH  = 'AUTH',
  FILE  = 'FILE',
  ADMIN = 'ADMIN',
  ERROR = 'ERROR',
}

// --- User / Auth ---
export interface UserClaims {
  role:     Role;
  tenantId: string;
  userId:   string;
}

export interface UserProfile {
  id:           string;
  firebaseUid:  string;
  email:        string;
  displayName:  string;
  photoURL:     string | null;
  role:         Role;
  tenantId:     string;
  isActive:     boolean;
  lastLoginAt:  string; // ISO date string
  createdAt:    string;
  updatedAt:    string;
}

// --- File ---
export interface FileMetadata {
  id:           string;
  filename:     string;
  originalName: string;
  mimeType:     string;
  size:         number; // bytes
  category:     FileCategory;
  storagePath:  string;
  downloadUrl:  string | null;
  uploadedBy:   string; // userId
  uploaderName: string;
  tenantId:     string;
  isShared:     boolean;
  shareCount:   number;
  downloadCount: number;
  tags:         string[];
  createdAt:    string;
  updatedAt:    string;
}

export interface FileShare {
  id:           string;
  fileId:       string;
  sharedWith:   string; // userId or email
  permission:   'VIEW' | 'DOWNLOAD' | 'MANAGE';
  expiresAt:    string | null;
  createdBy:    string;
  createdAt:    string;
}

// --- Audit ---
export interface AuditLog {
  id:          string;
  action:      AuditAction;
  category:    AuditCategory;
  performedBy: string; // userId
  performerName: string;
  performerEmail: string;
  targetUser:  string | null;
  entityType:  'FILE' | 'USER' | 'SYSTEM' | null;
  entityId:    string | null;
  ipAddress:   string;
  userAgent:   string;
  metadata:    Record<string, unknown>;
  tenantId:    string;
  createdAt:   string;
}

// --- API ---
export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data:    T[];
  pagination: {
    total:    number;
    page:     number;
    limit:    number;
    pages:    number;
    hasNext:  boolean;
    hasPrev:  boolean;
  };
  message:   string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error:   string;
  code:    string;
  details?: Record<string, string[]>;
  timestamp: string;
}

// --- Dashboard / Analytics ---
export interface DashboardMetrics {
  totalFiles:      number;
  storageUsed:     number; // bytes
  storageLimit:    number; // bytes
  sharedFiles:     number;
  recentActivity:  number;
  filesThisWeek:   number;
  downloadsToday:  number;
}

export interface StorageStats {
  total:     number;
  used:      number;
  available: number;
  byCategory: {
    category: FileCategory;
    size:     number;
    count:    number;
  }[];
}

export interface AdminMetrics {
  totalUsers:      number;
  activeUsers:     number;
  totalTenants:    number;
  activeTenants:   number;
  totalStorage:    number;
  totalFiles:      number;
  uploadsToday:    number;
  downloadsToday:  number;
}

export interface UploadTimeSeriesPoint {
  date:      string; // YYYY-MM-DD
  uploads:   number;
  downloads: number;
  newUsers:  number;
}

export interface StorageByUser {
  userId:      string;
  displayName: string;
  email:       string;
  storageUsed: number;
  fileCount:   number;
}

// --- UI Helpers ---
export interface NavItem {
  label:    string;
  icon:     React.ComponentType<{ className?: string }>;
  href:     string;
  roles?:   Role[];
  badge?:   number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface UploadingFile {
  id:       string; // uuid
  file:     File;
  progress: number; // 0-100
  status:   'pending' | 'uploading' | 'success' | 'error';
  error?:   string;
}
