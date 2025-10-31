import axios from 'axios'
import type {
  TokenResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Paginated,
  PredictionCreate,
  PredictionItem,
  PredictionResponse,
  FeedbackCreate,
  FeedbackItem,
  FeedbackRequest,
  HistoryFilters,
  Crop,
  Disease,
  StatsResponse,
  ModelInfo,
  PaginatedResponse,
  PredictionHistoryItem,
  HistoryQueryParams,
  DeviceListResponse,
  DeviceCreateRequest,
  DeviceRegistrationResponse,
} from '@/types/dto'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'phm.token'

export const AUTH_EVENTS = {
  LOGOUT: 'phm-auth-logout',
} as const

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TokenResponse
    return parsed.access_token
  } catch {
    return null
  }
}

export const http = axios.create({ baseURL: API_BASE_URL })

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error?.response?.status === 401) {
      // optional: refresh flow could be added here if backend supports it
      // For now, clear token to force login
      localStorage.removeItem(TOKEN_KEY)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_EVENTS.LOGOUT))
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const payload = new URLSearchParams()
    payload.append('username', data.username)
    payload.append('password', data.password)
    if (!payload.has('grant_type')) {
      payload.append('grant_type', 'password')
    }
    const res = await http.post<TokenResponse>('/auth/login', payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return res.data
  },
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const res = await http.post<TokenResponse>('/auth/register', data)
    return res.data
  },
  async me(): Promise<User> {
    const res = await http.get<User>('/auth/me')
    return res.data
  },
}

export const predictionsApi = {
  async list(filters: HistoryFilters): Promise<Paginated<PredictionItem>> {
    const res = await http.get<Paginated<PredictionItem>>('/predictions', { params: filters })
    return res.data
  },
  async create(data: PredictionCreate, onProgress?: (pct: number) => void): Promise<PredictionResponse> {
    const form = new FormData()
    form.append('file', data.file)
    if (data.tags?.length) data.tags.forEach((t) => form.append('tags', t))
    if (data.origin) form.append('origin', data.origin)
    if (data.device_id) form.append('device_id', data.device_id)
    if (data.device_local_timestamp) form.append('device_local_timestamp', data.device_local_timestamp)
    let reported = 0
    const res = await http.post<PredictionResponse>('/v1/predict', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!onProgress) return
        if (evt.total && evt.total > 0) {
          reported = Math.round((evt.loaded / evt.total) * 100)
        } else {
          reported = Math.min(95, reported + 5)
        }
        onProgress(reported)
      },
    })
    if (onProgress) onProgress(100)
    return res.data
  },
  async feedback(data: FeedbackCreate): Promise<FeedbackItem> {
    const res = await http.post<FeedbackItem>('/predictions/feedback', data)
    return res.data
  },
}

export const catalogApi = {
  async crops(params?: { q?: string; page?: number; page_size?: number }): Promise<Paginated<Crop>> {
    const res = await http.get<Paginated<Crop>>('/catalog/crops', { params })
    return res.data
  },
  async diseases(params?: { q?: string; crop_id?: string; page?: number; page_size?: number }): Promise<Paginated<Disease>> {
    const res = await http.get<Paginated<Disease>>('/catalog/diseases', { params })
    return res.data
  },
  async disease(id: string): Promise<Disease> {
    const res = await http.get<Disease>(`/catalog/diseases/${id}`)
    return res.data
  },
}

export const statsApi = {
  async get(params?: { date_from?: string; date_to?: string }): Promise<StatsResponse> {
    const res = await http.get<StatsResponse>('/stats', { params })
    return res.data
  },
}

export const modelApi = {
  async info(): Promise<ModelInfo> {
    const res = await http.get<ModelInfo>('/model_info')
    return res.data
  },
}

export const reviewApi = {
  async queue(params?: HistoryQueryParams): Promise<PaginatedResponse<PredictionHistoryItem>> {
    const res = await http.get<PaginatedResponse<PredictionHistoryItem>>('/v1/review/queue', {
      params: normalizeHistoryParams(params),
      paramsSerializer: { indexes: null },
    })
    return res.data
  },
  async submitFeedback(predictionId: number, data: FeedbackRequest): Promise<PredictionHistoryItem> {
    const res = await http.post<PredictionHistoryItem>(`/v1/predictions/${predictionId}/feedback`, data)
    return res.data
  },
}

function normalizeHistoryParams(params?: HistoryQueryParams) {
  if (!params) return undefined
  const cleaned: Record<string, unknown> = {}
  if (typeof params.skip === 'number' && params.skip >= 0) cleaned.skip = params.skip
  if (typeof params.limit === 'number' && params.limit > 0) cleaned.limit = params.limit
  if (params.crop) cleaned.crop = params.crop
  if (params.disease) cleaned.disease = params.disease
  if (params.tags && params.tags.length) cleaned.tags = params.tags
  if (typeof params.min_confidence === 'number') cleaned.min_confidence = params.min_confidence
  if (typeof params.max_confidence === 'number') cleaned.max_confidence = params.max_confidence
  if (params.start_date) cleaned.start_date = params.start_date
  if (params.end_date) cleaned.end_date = params.end_date
  if (typeof params.confirmed === 'boolean') cleaned.confirmed = params.confirmed
  if (params.origin) cleaned.origin = params.origin
  if (params.device_id) cleaned.device_id = params.device_id
  if (params.search) cleaned.search = params.search
  return cleaned
}

export const historyApi = {
  async list(params?: HistoryQueryParams): Promise<PaginatedResponse<PredictionHistoryItem>> {
    const res = await http.get<PaginatedResponse<PredictionHistoryItem>>('/v1/history', {
      params: normalizeHistoryParams(params),
      paramsSerializer: { indexes: null },
    })
    return res.data
  },
  async getById(id: number): Promise<PredictionHistoryItem | null> {
    const searchFirst = await historyApi.list({ limit: 1, search: String(id) })
    const matchFromSearch = searchFirst.items.find((item) => item.id === id)
    if (matchFromSearch) return matchFromSearch

    let skip = 0
    const limit = 100
    while (true) {
      const page = await historyApi.list({ skip, limit })
      if (!page.items.length) break
      const match = page.items.find((item) => item.id === id)
      if (match) return match
      skip += limit
      if (skip >= page.total) break
    }
    return null
  },
}

export const metadataApi = {
  async tags(): Promise<string[]> {
    const res = await http.get<string[]>('/v1/tags')
    return res.data
  },
  async crops(): Promise<string[]> {
    const res = await http.get<string[]>('/v1/crops')
    return res.data
  },
  async diseases(): Promise<string[]> {
    const res = await http.get<string[]>('/v1/diseases')
    return res.data
  },
}

export const mediaApi = {
  async fetchImage(path: string): Promise<Blob> {
    const sanitized = path.startsWith('/') ? path.slice(1) : path
    const res = await http.get<Blob>(`/v1/${sanitized}`, { responseType: 'blob' })
    return res.data
  },
}

export const devicesApi = {
  async list(): Promise<DeviceListResponse> {
    const res = await http.get<DeviceListResponse>('/v1/devices')
    return res.data
  },
  async register(data: DeviceCreateRequest): Promise<DeviceRegistrationResponse> {
    const payload = {
      name: data.name,
      location: data.location ?? null,
      device_id: data.device_id ?? null,
      tags: (data.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0),
    }
    const res = await http.post<DeviceRegistrationResponse>('/v1/devices', payload)
    return res.data
  },
}
