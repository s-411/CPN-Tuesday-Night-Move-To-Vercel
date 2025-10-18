/**
 * Rewardful Integration
 *
 * Handles interactions with the Rewardful SDK for affiliate tracking
 * and conversion events.
 */

/**
 * Initializes Rewardful SDK (should already be loaded via <head> script)
 * This function just verifies it's ready
 */
export function initializeRewardful(): boolean {
  if (typeof window !== 'undefined' && (window as any).rewardful) {
    console.log('[Rewardful] SDK loaded successfully');
    return true;
  }
  console.warn('[Rewardful] SDK not loaded - referral tracking may not work');
  return false;
}

/**
 * Tracks a conversion in Rewardful
 * Call this after user signs up via referred link
 *
 * @param email - User's email address
 */
export function trackConversion(email: string): void {
  if (typeof window !== 'undefined' && (window as any).rewardful) {
    try {
      (window as any).rewardful('convert', { email });
      console.log('[Rewardful] Conversion tracked for:', email);
    } catch (error) {
      console.error('[Rewardful] Failed to track conversion:', error);
    }
  } else {
    console.warn('[Rewardful] SDK not available, cannot track conversion');
  }
}

/**
 * Gets the current referral ID (if user came from referral link)
 * Rewardful stores this automatically when a user clicks a referral link
 */
export function getReferralId(): string | null {
  if (typeof window !== 'undefined' && (window as any).Rewardful) {
    const referralId = (window as any).Rewardful.referral || null;
    if (referralId) {
      console.log('[Rewardful] Current referral ID:', referralId);
    }
    return referralId;
  }
  return null;
}

/**
 * Checks if Rewardful SDK is loaded and ready
 */
export function isRewardfulReady(): boolean {
  return typeof window !== 'undefined' &&
         (window as any).rewardful !== undefined &&
         (window as any).Rewardful !== undefined;
}
