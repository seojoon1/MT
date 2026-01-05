export type Tag = string

export type MentStatus = 'pending' | 'approved' | 'rejected'

export type Ment = {
  id: string
  ko: string
  lo: string
  tags: Tag[]
  aiHint: string
  status: MentStatus
  createdAt: number
}
