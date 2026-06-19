/**
 * Centralised localStorage key constants.
 *
 * Import from here instead of repeating key strings across files. This prevents
 * typo-related bugs and makes it easy to rename keys in one place.
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'bkb_access_token',
  REFRESH_TOKEN: 'bkb_refresh_token',
  AUTH_STORE: 'bkb-auth',
  CART_STORE: 'bkb-cart',
  FAVOURITES_STORE: 'bkb-favourites',
  THEME: 'bkb-theme',
  SECURITY_LOGS: 'bkb-security-logs',
  LOGIN_HISTORY: 'bkb-login-history',
} as const;
