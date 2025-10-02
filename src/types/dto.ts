export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface User {
  id: string
  username: string
  email: string
  full_name?: string | null
  is_active: boolean
  is_admin?: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer' | string
  expires_in?: number
  refresh_token?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name?: string
}

export interface Crop {
  id: string
  name: string
  slug?: string
  image_url?: string | null
  description?: string | null
}

export interface Disease {
  id: string
  name: string
  code?: string | null
  crop_id?: string | null
  symptoms?: string[]
  description?: string | null
  recommendations?: string | null
  severity?: 'low' | 'medium' | 'high' | string
  image_url?: string | null
}

export interface ModelInfo {
  name: string
  version?: string
  created_at?: string
  classes_count?: number
  top_k?: number
  file_name?: string
  checksum?: string
  notes?: string | null
}

export interface PredictionConfidence {
  label: string
  disease_id?: string
  confidence: number
}

export interface PredictionCreate {
  image: File
  tags?: string[]
  metadata?: Record<string, unknown>
  run_async?: boolean
}

export interface PredictionItem {
  id: string
  image_url?: string
  uploader_id?: string
  predicted_disease_id?: string | null
  predicted_disease_name?: string | null
  top_k?: PredictionConfidence[]
  confidence?: number
  tags?: string[]
  created_at: string
  reviewed?: boolean
  feedback_id?: string | null
  status?: 'pending' | 'completed' | 'failed' | string
}

export interface PredictionResponse {
  prediction: PredictionItem
  model_info?: ModelInfo | null
  disease_detail?: Disease | null
  raw_scores?: Record<string, number>
}

export interface FeedbackCreate {
  prediction_id: string
  correct_disease_id?: string | null
  correct_disease_name?: string | null
  notes?: string | null
  tags?: string[]
  reporter_id?: string | null
}

export interface FeedbackItem {
  id: string
  prediction_id: string
  reporter_id?: string | null
  submitted_at: string
  correct_disease_id?: string | null
  correct_disease_name?: string | null
  notes?: string | null
  status?: 'pending' | 'approved' | 'rejected' | string
  reviewer_id?: string | null
  reviewed_at?: string | null
}

export interface FeedbackReviewRequest {
  feedback_id: string
  action: 'approve' | 'reject'
  reviewer_id?: string | null
  comment?: string | null
  apply_correction?: boolean
}

export interface HistoryFilters {
  page?: number
  page_size?: number
  date_from?: string
  date_to?: string
  tags?: string[]
  crop_id?: string
  disease_id?: string
  min_confidence?: number
  max_confidence?: number
  status?: string
  reviewed?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  uploader_id?: string
  query?: string
}

export interface StatsTimePoint {
  date: string
  count: number
}

export interface StatsDistributionBucket {
  label: string
  count: number
  percent?: number
}

export interface StatsResponse {
  timeseries?: StatsTimePoint[]
  by_disease?: StatsDistributionBucket[]
  by_crop?: StatsDistributionBucket[]
  feedback_outcomes?: StatsDistributionBucket[]
  accuracy_over_time?: { date: string; accuracy: number }[]
}

export interface ErrorResponse {
  detail?: string
  code?: string | number
  errors?: Record<string, unknown> | Array<{ loc?: string[]; msg: string; type?: string }>
}
