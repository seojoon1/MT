// ============================
// Storage Keys
// ============================

export const STORAGE_KEYS = {
  auth: {
    localId: 'auth/localId',
    username: 'auth/username',
    token: 'auth/token',
    userNum: 'auth/userNum',
    refreshToken: 'auth/refreshToken',
  },
  app: {
    ments: 'flirting_ments_ments',
    isAdmin: 'flirting_ments_isAdmin',
    users: 'flirting_ments_users',
    favorites: 'flirting_ments_favorites',
    language: 'flirting_ments_language',
  },
} as const

// ============================
// Department Tags
// ============================

export const DEPARTMENT_TAGS = [
  '컴퓨터공학과',
  '경영학과',
  '의예과',
  '간호학과',
  '디자인학과',
  '심리학과',
] as const

export type DepartmentTag = (typeof DEPARTMENT_TAGS)[number]

// ============================
// Routes
// ============================

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  MENTS: '/ments',
  MENT_NEW: '/ments/new',
  MENT_DETAIL: (id: string | number) => `/ments/${id}`,
  FAVORITES: '/favorites',
} as const

// ============================
// Validation
// ============================

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MIN_LOCAL_ID_LENGTH: 3,
  MIN_USERNAME_LENGTH: 3,
  MIN_MENT_LENGTH: 4,
} as const
