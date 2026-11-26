import { useSyncExternalStore } from 'react';
import config from '../../config';
import { getUser, isLoggedIn, subscribeAuth } from '../../utils/session';

function getViewer() {
  if (!isLoggedIn()) return '';
  const user = getUser();
  return String(user?.id || user?._id || 'signed-in');
}

function subscribe(listener) {
  const unsubscribe = subscribeAuth(listener);
  const onStorage = event => {
    if (event.key === null || event.key === config.storageKeys.auth || event.key === config.storageKeys.token) {
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    unsubscribe();
    window.removeEventListener('storage', onStorage);
  };
}

const serverViewer = () => '';

export default function useReviewViewer() {
  // Refreshing a token for the same user must not discard an in-progress draft.
  return useSyncExternalStore(subscribe, getViewer, serverViewer);
}
