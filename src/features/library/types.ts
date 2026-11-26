/**
 * Shot — mirrors the SQLite shots table from design.md §2.
 * JSON-array columns are pre-parsed into typed arrays.
 */
export interface Shot {
  id: string;
  assetId?: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  takenAt: string; // ISO 8601
  ingestedAt: string; // ISO 8601
  thumbPath: string; // local sandbox path or remote URL for demo

  dHash: string; // 64-bit hex

  ocrStatus: 'pending' | 'done' | 'error';
  ocrText?: string;

  isOtp: boolean;
  otpValue?: string;
  dates: string[];
  expiresAt?: string;
  prices: Array<{ amount: number; currency: string }>;
  urls: string[];
  phones: string[];
  isDuplicate: boolean;
  duplicateOf?: string[];

  // AI classification (absent until Smart sorting runs)
  category?: 'deal' | 'event' | 'place' | 'recipe' | 'receipt' | 'note' | 'junk';
  title?: string;
  reason?: string;
  aiPrice?: { amount: number; currency: string };
  place?: { name: string; address: string };
  confidence?: number;
  classifyStatus: 'pending' | 'done' | 'skipped' | 'error';

  status: 'active' | 'done' | 'buried';
  notificationIds: string[];
}
