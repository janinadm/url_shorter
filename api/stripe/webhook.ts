import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16'
})

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Use service role for admin operations
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const sig = req.headers['stripe-signature'] as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

    let event: Stripe.Event

    try {
        // Get raw body for signature verification
        const rawBody = await getRawBody(req)
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return res.status(400).json({ error: 'Webhook signature verification failed' })
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('Checkout completed for:', session.customer_email)

        // Update user's plan in Supabase
        if (session.customer_email) {
            const { error } = await supabase
                .from('profiles')
                .update({ plan: 'pro' })
                .eq('email', session.customer_email)

            if (error) {
                console.error('Failed to update plan:', error)
                return res.status(500).json({ error: 'Failed to update plan' })
            }

            console.log('Plan upgraded to pro for:', session.customer_email)
        }
    }

    return res.status(200).json({ received: true })
}

// Helper to get raw body from Vercel request
async function getRawBody(req: VercelRequest): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => {
            data += chunk
        })
        req.on('end', () => {
            resolve(data)
        })
        req.on('error', reject)
    })
}

// Disable body parsing for webhook signature verification
export const config = {
    api: {
        bodyParser: false,
    },
}
