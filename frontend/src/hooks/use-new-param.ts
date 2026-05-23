import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Reads ?new=1 from the URL, calls `open()` once, then strips the param.
 * Used by module pages so the command bar can deep-link "Create X".
 */
export function useNewParam(open: () => void) {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('new') === '1') {
      open();
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
