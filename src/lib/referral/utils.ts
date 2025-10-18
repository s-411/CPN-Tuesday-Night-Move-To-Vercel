/**
 * Referral Utility Functions
 *
 * Handles referral context detection, persistence, and retrieval
 * for the Rewardful referral program.
 */

export interface ReferralContext {
  isReferred: boolean;
  referralId: string | null; // Rewardful's unique referral ID (UUID)
  affiliateId: string | null; // Rewardful affiliate ID
  timestamp: number;
}

/**
 * Detects if current page load came from a referral link
 * Checks for Rewardful.referral in global scope
 */
export function detectReferralContext(): ReferralContext | null {
  // Check if Rewardful SDK loaded
  if (typeof window !== 'undefined' && (window as any).Rewardful) {
    const referralId = (window as any).Rewardful.referral;

    if (referralId) {
      console.log('[Referral] Detected referral ID:', referralId);
      return {
        isReferred: true,
        referralId,
        affiliateId: null, // Will be populated after conversion
        timestamp: Date.now(),
      };
    }
  }

  // Fallback: check URL parameter ?ref=
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');

    if (refParam) {
      console.log('[Referral] Detected ref parameter:', refParam);
      return {
        isReferred: true,
        referralId: refParam,
        affiliateId: null,
        timestamp: Date.now(),
      };
    }
  }

  return null;
}

/**
 * Saves referral context to sessionStorage
 * This persists the referral across page navigation during signup
 */
export function persistReferralContext(context: ReferralContext): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('referral_context', JSON.stringify(context));
      console.log('[Referral] Persisted referral context to sessionStorage');
    } catch (error) {
      console.error('[Referral] Failed to persist referral context:', error);
    }
  }
}

/**
 * Retrieves referral context from sessionStorage
 */
export function getReferralContext(): ReferralContext | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('referral_context');
      if (stored) {
        const context = JSON.parse(stored);
        console.log('[Referral] Retrieved referral context from sessionStorage');
        return context;
      }
    } catch (error) {
      console.error('[Referral] Failed to retrieve referral context:', error);
    }
  }
  return null;
}

/**
 * Clears referral context from sessionStorage
 * Called after successful conversion to prevent re-use
 */
export function clearReferralContext(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('referral_context');
      console.log('[Referral] Cleared referral context from sessionStorage');
    } catch (error) {
      console.error('[Referral] Failed to clear referral context:', error);
    }
  }
}

/**
 * Checks if referral context is still valid (not expired)
 * Referrals expire after 60 days (Rewardful default cookie window)
 */
export function isReferralContextValid(context: ReferralContext | null): boolean {
  if (!context) return false;

  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
  const isValid = Date.now() - context.timestamp < SIXTY_DAYS_MS;

  if (!isValid) {
    console.log('[Referral] Context expired, clearing');
    clearReferralContext();
  }

  return isValid;
}

/**
 * Sets a flag to indicate user is in the referral signup flow
 * This prevents the dashboard from rendering before redirect to /activating-trial
 */
export function setReferralSignupInProgress(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('referral_signup_in_progress', 'true');
    console.log('[Referral] Set signup in progress flag');
  }
}

/**
 * Checks if user is currently in the referral signup flow
 */
export function isReferralSignupInProgress(): boolean {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('referral_signup_in_progress') === 'true';
  }
  return false;
}

/**
 * Clears the referral signup in progress flag
 * Called after user reaches /activating-trial page
 */
export function clearReferralSignupInProgress(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('referral_signup_in_progress');
    console.log('[Referral] Cleared signup in progress flag');
  }
}
