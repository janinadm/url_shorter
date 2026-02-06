/**
 * UI Strings Constants
 * 
 * Centralized text messages for the application.
 * All texts in English for consistency and easy translation.
 */

export const STRINGS = {
    // Time-related messages
    TIME: {
        DAYS: (count: number) => `${count} day${count !== 1 ? 's' : ''}`,
        HOURS: (count: number) => `${count} hour${count !== 1 ? 's' : ''}`,
        AVAILABLE_IN: (time: string) => `Will be available in ~${time}`,
        EXPIRES_IN: (time: string) => `Expires in ${time}`,
        EXPIRED: 'Expired',
    },

    // Alias/Slug messages
    ALIAS: {
        TAKEN: (alias: string) => `The alias "${alias}" is already taken`,
        TAKEN_FREE: (alias: string, time: string) =>
            `The alias "${alias}" is taken. ${STRINGS.TIME.AVAILABLE_IN(time)}`,
        TAKEN_PERMANENT: (alias: string) =>
            `The alias "${alias}" is in use by a Pro user (permanent)`,
        AVAILABLE: 'Alias available',
        CLAIM_FAILED: 'Failed to claim expired alias',
        CLAIM_RENEWED: (alias: string) =>
            `Could not claim alias "${alias}". It may have been renewed.`,
    },

    // Bio Page messages
    BIO: {
        SLUG_TAKEN: (slug: string) => `Slug "${slug}" is already taken`,
        SLUG_TAKEN_FREE: (slug: string, time: string) =>
            `Slug "${slug}" is taken. ${STRINGS.TIME.AVAILABLE_IN(time)}`,
        SLUG_AVAILABLE: '✓ Slug available',
        CREATE_SUCCESS: 'Bio Page created successfully',
        UPDATE_SUCCESS: 'Bio Page updated successfully',
        DELETE_SUCCESS: 'Bio Page deleted successfully',
    },

    // User plan messages
    PLAN: {
        FREE_LIMIT_URLS: 'Free users can create up to 3 shortened URLs',
        FREE_LIMIT_BIO: 'Free users can only create 1 Bio Page',
        UPGRADE_CTA: 'Upgrade to Pro',
        FREE_EXPIRATION: '3 days',
    },

    // Form validation
    VALIDATION: {
        SLUG_FORMAT: 'Only lowercase letters, numbers, and hyphens allowed',
        REQUIRED: 'This field is required',
        MIN_LENGTH: (min: number) => `Minimum ${min} characters`,
        MAX_LENGTH: (max: number) => `Maximum ${max} characters`,
    },

    // Actions
    ACTIONS: {
        SAVE: 'Save',
        CANCEL: 'Cancel',
        EDIT: 'Edit',
        DELETE: 'Delete',
        CREATE: 'Create',
        COPY: 'Copy',
        COPIED: 'Copied!',
        LOADING: 'Loading...',
        SAVING: 'Saving...',
        CREATING: 'Creating...',
    },

    // Navigation
    NAV: {
        BACK: 'Go back',
        DASHBOARD: 'Dashboard',
        BIO_PAGES: 'Bio Pages',
        SETTINGS: 'Settings',
        ANALYTICS: 'Analytics',
    },

    // Auth messages
    AUTH: {
        SIGN_IN: 'Sign In',
        SIGN_UP: 'Sign Up',
        SIGN_OUT: 'Sign Out',
        EMAIL_CONFIRMED: 'Email confirmed successfully!',
        CONFIRMATION_FAILED: 'Email confirmation failed',
    },
} as const

/**
 * Helper to calculate time remaining as days or hours
 */
export function formatTimeRemaining(expiresAt: Date): string {
    const now = new Date()
    const diffMs = expiresAt.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
        return STRINGS.TIME.EXPIRED
    }

    return STRINGS.TIME.DAYS(diffDays)
}
