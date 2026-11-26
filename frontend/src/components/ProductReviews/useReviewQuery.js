import { useEffect, useState } from 'react';
import { raw } from '../../api';

/** Tag results with their request so a new page never briefly shows old reviews. */
export default function useReviewQuery(url, params = {}, revision = 0, onLoaded) {
  const paramsKey = JSON.stringify(params);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = `${url}:${paramsKey}:${revision}:${retry}`;
  const current = result?.key === requestKey ? result : null;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    raw.get(url, { params: JSON.parse(paramsKey), signal: controller.signal })
      .then(envelope => {
        if (!active) return;
        setResult({ key: requestKey, data: envelope.data, meta: envelope.meta, error: null });
        onLoaded?.(envelope);
      })
      .catch(error => {
        if (active) setResult({ key: requestKey, data: null, meta: null, error });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [url, paramsKey, requestKey, onLoaded]);

  return {
    data: current?.data,
    meta: current?.meta,
    error: current?.error,
    loading: !current,
    refetch: () => setRetry(value => value + 1),
  };
}
