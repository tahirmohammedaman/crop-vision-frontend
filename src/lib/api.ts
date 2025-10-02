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
  FeedbackReviewRequest,
  HistoryFilters,
  Crop,
  Disease,
  StatsResponse,
  ModelInfo,
} from '@/types/dto'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'phm.token'

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
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await http.post<TokenResponse>('/auth/login', data)
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
    form.append('image', data.image)
    if (data.tags) data.tags.forEach((t) => form.append('tags', t))
    if (data.metadata) form.append('metadata', JSON.stringify(data.metadata))
    if (typeof data.run_async === 'boolean') form.append('run_async', String(data.run_async))
    const res = await http.post<PredictionResponse>('/predictions', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!onProgress || !evt.total) return
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      },
    })
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
  async list(params?: { status?: string; page?: number; page_size?: number }): Promise<Paginated<FeedbackItem>> {
    const res = await http.get<Paginated<FeedbackItem>>('/predictions/feedback', { params })
    return res.data
  },
  async act(data: FeedbackReviewRequest): Promise<FeedbackItem> {
    const res = await http.post<FeedbackItem>('/predictions/feedback/review', data)
    return res.data
  },
}
