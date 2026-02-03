import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { AnalyticsData } from '@/types'
import { FREE_ANALYTICS_HISTORY_DAYS, isPro } from '@/constants'

function generateMockAnalytics(userIsPro: boolean): AnalyticsData {
    const days = userIsPro ? 30 : FREE_ANALYTICS_HISTORY_DAYS
    const clicksByDate: { date: string; clicks: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        clicksByDate.push({
            date: date.toISOString().split('T')[0]!,
            clicks: Math.floor(Math.random() * 50) + 5
        })
    }

    const base: AnalyticsData = {
        totalClicks: clicksByDate.reduce((sum, d) => sum + d.clicks, 0),
        clicksByDate,
        clicksByBrowser: [
            { browser: 'Chrome', clicks: 45 },
            { browser: 'Safari', clicks: 28 },
            { browser: 'Firefox', clicks: 15 },
            { browser: 'Edge', clicks: 8 },
            { browser: 'Other', clicks: 4 }
        ],
        clicksByCountry: [
            { country: 'United States', clicks: 42 },
            { country: 'United Kingdom', clicks: 18 },
            { country: 'Germany', clicks: 12 },
            { country: 'France', clicks: 10 },
            { country: 'Other', clicks: 18 }
        ],
        isLimited: !userIsPro
    }

    if (userIsPro) {
        base.clicksByHour = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            clicks: Math.floor(Math.random() * 20) + 1
        }))
        base.topReferrers = [
            { referrer: 'twitter.com', clicks: 34 },
            { referrer: 'facebook.com', clicks: 28 },
            { referrer: 'linkedin.com', clicks: 15 },
            { referrer: 'Direct', clicks: 12 },
            { referrer: 'instagram.com', clicks: 8 }
        ]
        base.uniqueVisitors = Math.floor(base.totalClicks * 0.7)
    }

    return base
}

function extractDomain(referer: string): string {
    if (!referer) return 'Direct'
    try {
        const url = new URL(referer)
        return url.hostname.replace('www.', '')
    } catch {
        return 'Direct'
    }
}

export const useAnalyticsStore = defineStore('analytics', () => {
    const data = ref<AnalyticsData | null>(null)
    const loading = ref(false)

    async function fetchAnalytics(urlId: string) {
        const authStore = useAuthStore()
        const userIsPro = isPro(authStore.user?.plan)

        loading.value = true
        try {
            if (!isSupabaseConfigured) {
                data.value = generateMockAnalytics(userIsPro)
                return
            }

            let query = supabase
                .from('clicks')
                .select('*')
                .eq('url_id', urlId)

            if (!userIsPro) {
                const limitDate = new Date()
                limitDate.setDate(limitDate.getDate() - FREE_ANALYTICS_HISTORY_DAYS)
                query = query.gte('clicked_at', limitDate.toISOString())
            }

            const { data: clicks, error } = await query

            if (error) throw error

            // Aggregate by different dimensions
            const clicksByDate: Record<string, number> = {}
            const clicksByBrowser: Record<string, number> = {}
            const clicksByCountry: Record<string, number> = {}
            const clicksByHour: Record<number, number> = {}
            const referrerCounts: Record<string, number> = {}
            const uniqueIps = new Set<string>()

            for (const click of clicks || []) {
                const date = click.clicked_at.split('T')[0]
                clicksByDate[date] = (clicksByDate[date] || 0) + 1

                const browser = click.browser || 'Unknown'
                clicksByBrowser[browser] = (clicksByBrowser[browser] || 0) + 1

                const country = click.country || 'Unknown'
                clicksByCountry[country] = (clicksByCountry[country] || 0) + 1

                if (userIsPro) {
                    const hour = new Date(click.clicked_at).getHours()
                    clicksByHour[hour] = (clicksByHour[hour] || 0) + 1

                    const referrer = extractDomain(click.referer)
                    referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1

                    if (click.ip_hash) {
                        uniqueIps.add(click.ip_hash)
                    }
                }
            }

            const result: AnalyticsData = {
                totalClicks: clicks?.length || 0,
                clicksByDate: Object.entries(clicksByDate)
                    .map(([date, clicks]) => ({ date, clicks }))
                    .sort((a, b) => a.date.localeCompare(b.date)),
                clicksByBrowser: Object.entries(clicksByBrowser)
                    .map(([browser, clicks]) => ({ browser, clicks }))
                    .sort((a, b) => b.clicks - a.clicks),
                clicksByCountry: Object.entries(clicksByCountry)
                    .map(([country, clicks]) => ({ country, clicks }))
                    .sort((a, b) => b.clicks - a.clicks),
                isLimited: !userIsPro
            }

            if (userIsPro) {
                result.clicksByHour = Array.from({ length: 24 }, (_, hour) => ({
                    hour,
                    clicks: clicksByHour[hour] || 0
                }))
                result.topReferrers = Object.entries(referrerCounts)
                    .map(([referrer, clicks]) => ({ referrer, clicks }))
                    .sort((a, b) => b.clicks - a.clicks)
                    .slice(0, 5)
                result.uniqueVisitors = uniqueIps.size
            }

            data.value = result
        } catch (e) {
            console.error('Error fetching analytics:', e)
            // Set empty data on error so UI doesn't stay stuck
            data.value = {
                totalClicks: 0,
                clicksByDate: [],
                clicksByBrowser: [],
                clicksByCountry: [],
                isLimited: !userIsPro
            }
        } finally {
            loading.value = false
        }
    }

    function clearAnalytics() {
        data.value = null
    }

    return {
        data,
        loading,
        fetchAnalytics,
        clearAnalytics
    }
})
