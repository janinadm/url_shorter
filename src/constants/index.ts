/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values
 */

// =============================================================================
// URL Creation
// =============================================================================

/** Length of auto-generated short codes */
export const SHORT_CODE_LENGTH = 6

/** Characters used for generating random short codes */
export const SHORT_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Minimum length for custom aliases */
export const CUSTOM_ALIAS_MIN_LENGTH = 3

/** Maximum length for custom aliases */
export const CUSTOM_ALIAS_MAX_LENGTH = 20

/** Regex pattern for valid custom aliases (alphanumeric and hyphens) */
export const CUSTOM_ALIAS_PATTERN = /^[a-zA-Z0-9-]+$/

// =============================================================================
// Link Expiration
// =============================================================================

/** Number of days before free plan links expire */
export const FREE_LINK_EXPIRATION_DAYS = 3

/** Number of days of analytics history for free users */
export const FREE_ANALYTICS_HISTORY_DAYS = 7

// =============================================================================
// API Configuration
// =============================================================================

/** Timeout in ms for API requests */
export const REQUEST_TIMEOUT_MS = 15000

// =============================================================================
// Plans
// =============================================================================

/** Plan IDs */
export type PlanId = 'free' | 'pro' | 'enterprise'

/** Plans that have full analytics access */
export const PRO_PLANS: PlanId[] = ['pro', 'enterprise']

/**
 * Check if a plan has Pro features
 */
export function isPro(plan: PlanId | undefined): boolean {
    return PRO_PLANS.includes(plan as PlanId)
}
