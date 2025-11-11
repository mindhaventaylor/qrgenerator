// Utility functions for reading landing page variant from cookies/localStorage

type LandingVariantKey = 'control' | 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | 'page6';

const VALID_VARIANTS: LandingVariantKey[] = ['control', 'page1', 'page2', 'page3', 'page4', 'page5', 'page6'];
const COOKIE_KEY = 'landing_page_variant';
const STORAGE_KEY = 'landing_page_variant';

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Get the stored landing page variant from cookie or localStorage
 * Returns the variant key or null if not found/invalid
 */
export function getLandingVariant(): LandingVariantKey | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    // Check cookie first (more persistent)
    const cookieVariant = getCookie(COOKIE_KEY);
    if (cookieVariant && VALID_VARIANTS.includes(cookieVariant as LandingVariantKey)) {
      return cookieVariant as LandingVariantKey;
    }
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_VARIANTS.includes(stored as LandingVariantKey)) {
      return stored as LandingVariantKey;
    }
  } catch (error) {
    console.warn('[VariantUtils] Failed to read stored variant', error);
  }
  return null;
}

/**
 * Get the landing page variant, defaulting to 'page5' if not found
 * This ensures we always use the premium theme
 */
export function getLandingVariantOrDefault(): LandingVariantKey {
  return getLandingVariant() || 'page5';
}

