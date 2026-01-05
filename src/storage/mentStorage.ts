import type { Ment, MentStatus } from '../types/ment'

const APP_PREFIX = 'flirting_ments'

const MENTS_KEY = `${APP_PREFIX}_ments`
const ADMIN_KEY = `${APP_PREFIX}_isAdmin`

const DEPARTMENT_TAGS = [
  '컴퓨터공학과',
  '경영학과',
  '의예과',
  '간호학과',
  '디자인학과',
  '심리학과',
] as const

export const DEFAULT_DEPARTMENT_TAGS: string[] = [...DEPARTMENT_TAGS]

function now(): number {
  return Date.now()
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${now()}_${Math.random().toString(16).slice(2)}`
}

function safeParseMents(json: string | null): Ment[] | null {
  if (!json) return null
  try {
    const data = JSON.parse(json) as unknown
    if (!Array.isArray(data)) return null
    return data.filter((x): x is Ment => {
      if (!x || typeof x !== 'object') return false
      const m = x as Record<string, unknown>
      return (
        typeof m.id === 'string' &&
        typeof m.ko === 'string' &&
        typeof m.lo === 'string' &&
        Array.isArray(m.tags) &&
        typeof m.aiHint === 'string' &&
        (m.status === 'pending' || m.status === 'approved' || m.status === 'rejected') &&
        typeof m.createdAt === 'number'
      )
    })
  } catch {
    return null
  }
}

const seedMents: Ment[] = [
  {
    id: 'seed_cs_01',
    ko: '혹시… 오늘 과제 끝나면 같이 커피 마실래요?',
    lo: 'ຖ້າ… ວຽກບ້ານເສັດແລ້ວ ໄປດື່ມກາເຟນຳກັນບໍ?',
    tags: ['컴퓨터공학과'],
    aiHint: '과제/커피로 자연스럽게 다음 약속을 제안하는 멘트예요.',
    status: 'approved',
    createdAt: 1700000000000,
  },
  {
    id: 'seed_biz_01',
    ko: '너랑 얘기하면 내 하루 수익률이 올라가는 기분이야.',
    lo: 'ຄຸຍກັບເຈົ້າແລ້ວ ຮູ້ສຶກວ່າວັນນີ້ກໍາໄລເພີ່ມຂຶ້ນ.',
    tags: ['경영학과'],
    aiHint: '전공 밈을 가볍게 섞어서 호감도를 올리는 타입이에요.',
    status: 'approved',
    createdAt: 1700000100000,
  },
  {
    id: 'seed_med_01',
    ko: '오늘은 너 덕분에 심장이 두근두근… 정상인가요?',
    lo: 'ມື້ນີ້ໃຈຂ້ອຍເຕັ້ນໄວ… ນີ້ປົກກະຕິບໍ?',
    tags: ['의예과'],
    aiHint: '가벼운 “진단” 농담으로 분위기를 살리는 멘트예요.',
    status: 'approved',
    createdAt: 1700000200000,
  },
  {
    id: 'seed_nurse_01',
    ko: '피곤해 보여… 내가 네 기분부터 케어해도 될까?',
    lo: 'ເຈົ້າເບິ່ງເຫນື່ອຍ… ຂ້ອຍຂໍດູແລອາລົມເຈົ້າກ່ອນໄດ້ບໍ?',
    tags: ['간호학과'],
    aiHint: '배려/케어 키워드로 다정함을 강조해요.',
    status: 'approved',
    createdAt: 1700000300000,
  },
  {
    id: 'seed_design_01',
    ko: '너랑 있으면 내 세상이 핑크 톤으로 보정돼.',
    lo: 'ຢູ່ກັບເຈົ້າແລ້ວ ໂລກຂອງຂ້ອຍເຫມືອນຖືກປັບໂທນໃຫ້ເປັນສີຊົມພູ.',
    tags: ['디자인학과'],
    aiHint: '톤/보정 같은 디자인 언어로 로맨틱하게 표현해요.',
    status: 'pending',
    createdAt: 1700000400000,
  },
  {
    id: 'seed_psy_01',
    ko: '너랑 눈 마주치면, 내 마음이 먼저 반응해.',
    lo: 'ພໍສົບຕາກັບເຈົ້າ ໃຈຂ້ອຍກໍຕອບສະນອງກ່ອນ.',
    tags: ['심리학과'],
    aiHint: '감정/반응 같은 단어로 은근하게 고백하는 느낌이에요.',
    status: 'approved',
    createdAt: 1700000500000,
  },
]

function ensureSeeded(): Ment[] {
  const existing = safeParseMents(localStorage.getItem(MENTS_KEY))
  if (existing && existing.length > 0) return existing
  localStorage.setItem(MENTS_KEY, JSON.stringify(seedMents))
  return seedMents
}

export function getMents(): Ment[] {
  return ensureSeeded().slice().sort((a, b) => b.createdAt - a.createdAt)
}

export function setMents(next: Ment[]): void {
  localStorage.setItem(MENTS_KEY, JSON.stringify(next))
}

export function getMentById(id: string): Ment | null {
  const ments = ensureSeeded()
  return ments.find((m) => m.id === id) ?? null
}

export function createMent(input: {
  ko: string
  lo: string
  tags: string[]
  aiHint?: string
}): Ment {
  const ments = ensureSeeded()
  const newMent: Ment = {
    id: makeId(),
    ko: input.ko,
    lo: input.lo,
    tags: input.tags,
    aiHint: input.aiHint ?? 'AI가 컨셉을 검토 중이에요. 조금만 기다려 주세요.',
    status: 'pending',
    createdAt: now(),
  }
  const next = [newMent, ...ments]
  setMents(next)
  return newMent
}

export function updateMentStatus(id: string, status: MentStatus): Ment[] {
  const ments = ensureSeeded()
  const next = ments.map((m) => (m.id === id ? { ...m, status } : m))
  setMents(next)
  return next
}

export function deleteMent(id: string): Ment[] {
  const ments = ensureSeeded()
  const next = ments.filter((m) => m.id !== id)
  setMents(next)
  return next
}

export function getIsAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === '1'
}

export function setIsAdmin(next: boolean): void {
  localStorage.setItem(ADMIN_KEY, next ? '1' : '0')
}
