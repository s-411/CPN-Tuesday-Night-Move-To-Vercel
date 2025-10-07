export type OnboardingStep1 = {
  name: string;
  age: string;
  ethnicity: string;
  hairColor: string;
  locationCity: string;
  locationCountry: string;
  rating: number;
  v: 1;
};

export type OnboardingStep2 = {
  date: string;
  amountSpent: string;
  hours: string;
  minutes: string;
  numberOfNuts: string;
  v: 1;
};

export type OnboardingState = {
  commitStatus: 'idle' | 'in-progress' | 'success' | 'error';
  v: 1;
};

const KEY_STEP1 = 'onboarding.step1';
const KEY_STEP2 = 'onboarding.step2';
const KEY_STATE = 'onboarding.state';

function read<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota or serialization errors
  }
}

export function getStep1(): OnboardingStep1 | null {
  return read<OnboardingStep1>(KEY_STEP1);
}

export function setStep1(v: OnboardingStep1): void {
  write(KEY_STEP1, v);
}

export function getStep2(): OnboardingStep2 | null {
  return read<OnboardingStep2>(KEY_STEP2);
}

export function setStep2(v: OnboardingStep2): void {
  write(KEY_STEP2, v);
}

export function getState(): OnboardingState | null {
  return read<OnboardingState>(KEY_STATE);
}

export function setState(v: OnboardingState): void {
  write(KEY_STATE, v);
}

export function clearOnboarding(): void {
  try {
    window.sessionStorage.removeItem(KEY_STEP1);
    window.sessionStorage.removeItem(KEY_STEP2);
    window.sessionStorage.removeItem(KEY_STATE);
  } catch {
    // noop
  }
}


