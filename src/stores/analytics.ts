import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AnalyticsData } from '@/types'

// Generate mock analytics data for development
function generateMockAnalytics(): AnalyticsData {
    const days = 7
    const clicksByDate: { date: string; clicks: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        clicksByDate.push({
            date: date.toISOString().split('T')[0]!,
            clicks: Math.floor(Math.random() * 50) + 5
        })
    }

    return {
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
        ]
    }
}

export const useAnalyticsStore = defineStore('analytics', () => {
    const data = ref<AnalyticsData | null>(null)
    const loading = ref(false)

    async function fetchAnalytics(urlId: string) {
        loading.value = true
        try {
            if (!isSupabaseConfigured) {
                // Use mock data in dev mode
                data.value = generateMockAnalytics()
                return
            }

            // Fetch clicks for this URL
            const { data: clicks, error } = await supabase
                .from('clicks')
                .select('*')
                .eq('url_id', urlId)

            if (error) throw error

            // Aggregate data
            const clicksByDate: Record<string, number> = {}
            const clicksByBrowser: Record<string, number> = {}
            const clicksByCountry: Record<string, number> = {}

            for (const click of clicks || []) {
                // By date
                const date = click.clicked_at.split('T')[0]
                clicksByDate[date] = (clicksByDate[date] || 0) + 1

                // By browser
                const browser = click.browser || 'Unknown'
                clicksByBrowser[browser] = (clicksByBrowser[browser] || 0) + 1

                // By country
                const country = click.country || 'Unknown'
                clicksByCountry[country] = (clicksByCountry[country] || 0) + 1
            }

            data.value = {
                totalClicks: clicks?.length || 0,
                clicksByDate: Object.entries(clicksByDate)
                    .map(([date, clicks]) => ({ date, clicks }))
                    .sort((a, b) => a.date.localeCompare(b.date)),
                clicksByBrowser: Object.entries(clicksByBrowser)
                    .map(([browser, clicks]) => ({ browser, clicks }))
                    .sort((a, b) => b.clicks - a.clicks),
                clicksByCountry: Object.entries(clicksByCountry)
                    .map(([country, clicks]) => ({ country, clicks }))
                    .sort((a, b) => b.clicks - a.clicks)
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
