import config from './config';

const PREFIX = `${config.appName.toLowerCase()}:`;

/** Persist any JSON-serialisable value. Returns false when storage is full/blocked. */
export function saveState(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[persist] save failed:', key, err);
    return false;
  }
}

/** Read a value back; returns `fallback` when missing or corrupt. */
export function loadState(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[persist] load failed:', key, err);
    return fallback;
  }
}

export function removeState(key) {
  try {
    localStorage.removeItem(PREFIX + key);
    return true;
  } catch (err) {
    console.warn('[persist] remove failed:', key, err);
    return false;
  }
}

export function hasState(key) {
  try {
    return localStorage.getItem(PREFIX + key) !== null;
  } catch {
    return false;
  }
}

/** Redux `StateUpdater` helper: only persist a slice when it actually changed. */
export function createPersistedSlice(key, onChange) {
  return (state, prev) => {
    if (state === prev) return;
    saveState(key, state);
    if (typeof onChange === 'function') onChange(state);
  };
}

export const KEYS = config.storageKeys;
