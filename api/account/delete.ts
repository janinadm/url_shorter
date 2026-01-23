import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin operations
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { userId } = req.body

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
    }

    console.log('Delete account request for user:', userId)

    try {
        // 1. Get user's URL IDs first
        const { data: urlData } = await supabase
            .from('urls')
            .select('id')
            .eq('user_id', userId)

        // 2. Delete clicks for those URLs
        if (urlData && urlData.length > 0) {
            const urlIds = urlData.map((u: { id: string }) => u.id)
            const { error: clicksError } = await supabase
                .from('clicks')
                .delete()
                .in('url_id', urlIds)

            if (clicksError) {
                console.error('Error deleting clicks:', clicksError)
            }
        }

        // 2. Delete user's URLs
        const { error: urlError } = await supabase
            .from('urls')
            .delete()
            .eq('user_id', userId)

        if (urlError) {
            console.error('Error deleting urls:', urlError)
            throw urlError
        }

        // 3. Delete user's profile
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) {
            console.error('Error deleting profile:', profileError)
            throw profileError
        }

        // 4. Delete from Supabase Auth (this is the critical step!)
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)

        if (authError) {
            console.error('Error deleting auth user:', authError)
            throw authError
        }

        console.log('Successfully deleted user:', userId)
        return res.status(200).json({ success: true })

    } catch (error) {
        console.error('Delete account failed:', error)
        return res.status(500).json({
            error: 'Failed to delete account',
            details: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
