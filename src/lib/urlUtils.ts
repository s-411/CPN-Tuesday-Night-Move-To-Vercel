export function getPageParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('page');
}

export function getSessionId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('session_id');
}

export function setPageParam(page: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  window.history.pushState({}, '', url.toString());
}

export function clearPageParam(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('page');
  url.searchParams.delete('session_id');
  window.history.replaceState({}, '', url.toString());
}

export function isSubscriptionSuccessPage(): boolean {
  return getPageParam() === 'subscription-success';
}
