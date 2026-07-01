/**
 * Application-wide configuration constants.
 *
 * SST_RATE (TAX_RATE) must stay in sync with the backend's {@code bkb.tax.rate} configuration
 * (default 0.06 in application.yml). If the backend value changes, update this too.
 */
export const APP_CONFIG = {
  SST_RATE: 0.06,
  SESSION_TIMEOUTS_MS: {
    ADMIN: 10 * 60 * 1000,      // 10 minutes — elevated security for admin accounts
    MANAGER: 15 * 60 * 1000,    // 15 minutes
    STAFF: 365 * 24 * 60 * 60 * 1000,      // 1 year (Kiosk / POS mode)
    CUSTOMER: 30 * 60 * 1000,   // 30 minutes
    GUEST: 365 * 24 * 60 * 60 * 1000,      // 1 year (Kiosk / POS mode)
  },
  SESSION_WARNING_BEFORE_MS: 60 * 1000, // 60 seconds warning
} as const;

export const TAX_RATE = APP_CONFIG.SST_RATE;
export const SESSION_TIMEOUTS_MS = APP_CONFIG.SESSION_TIMEOUTS_MS;
export const SESSION_WARNING_BEFORE_MS = APP_CONFIG.SESSION_WARNING_BEFORE_MS;
