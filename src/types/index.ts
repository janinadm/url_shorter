export interface User {
  id: string
  email: string
  name?: string
  plan: 'free' | 'pro' | 'enterprise'
  stripeCustomerId?: string
  createdAt: string
}

export interface ShortUrl {
  id: string
  userId: string
  shortCode: string
  originalUrl: string
  title?: string
  createdAt: string
  clicks?: number
}

export interface ClickEvent {
  id: string
  urlId: string
  clickedAt: string
  browser?: string
  country?: string
  referer?: string
}

export interface AnalyticsData {
  totalClicks: number
  clicksByDate: { date: string; clicks: number }[]
  clicksByBrowser: { browser: string; clicks: number }[]
  clicksByCountry: { country: string; clicks: number }[]
}

export interface Plan {
  id: 'free' | 'pro' | 'enterprise'
  name: string
  price: number
  urlLimit: number
  features: string[]
}
