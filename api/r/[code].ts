import { createClient } from '@supabase/supabase-js'

export const config = {
    runtime: 'edge',
}

/**
 * Hash IP address for privacy-preserving unique visitor tracking
 */
async function hashIp(ip: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(ip)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default async function handler(request: Request) {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const shortCode = pathParts[pathParts.length - 1]

    if (!shortCode) {
        return new Response('Short code is required', { status: 400 })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        return new Response('Server configuration error', { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Look up the short code
    const { data: urlData, error: urlError } = await supabase
        .from('urls')
        .select('id, original_url, expires_at')
        .eq('short_code', shortCode)
        .single()

    if (urlError || !urlData) {
        return new Response(`Link not found: ${shortCode}`, { status: 404 })
    }

    // Check if link is expired
    if (urlData.expires_at && new Date(urlData.expires_at) < new Date()) {
        const expiredUrl = new URL('/expired', request.url)
        return Response.redirect(expiredUrl.toString(), 302)
    }

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const ipHash = await hashIp(ip.split(',')[0].trim())

    // Get browser and country info from headers
    const userAgent = request.headers.get('user-agent') || ''
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown'
    const referer = request.headers.get('referer') || ''

    // Detect browser from user agent
    let browser = 'Other'
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Chrome'
    } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari'
    } else if (userAgent.includes('Edg')) {
        browser = 'Edge'
    }

    // Detect device type from user agent
    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop'
    const ua = userAgent.toLowerCase()
    if (/ipad|tablet|playbook|silk/.test(ua)) {
        deviceType = 'tablet'
    } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) {
        deviceType = 'mobile'
    }

    // Record click analytics
    try {
        await supabase
            .from('clicks')
            .insert({
                url_id: urlData.id,
                device_type: deviceType,
                browser,
                country,
                referer,
                user_agent: userAgent.substring(0, 500),
                ip_hash: ipHash
            })
    } catch (e) {
        console.error('Failed to record click:', e)
    }

    // Redirect to original URL
    return Response.redirect(urlData.original_url, 302)
}
