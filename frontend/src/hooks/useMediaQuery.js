import { useEffect, useState } from 'react';

/** Sin `matchMedia` (pruebas, navegadores viejos) devuelve `fallback`. */
export function useMediaQuery(query, fallback = true) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query)?.matches ?? fallback);

  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) return undefined;
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener?.('change', update);
    return () => list.removeEventListener?.('change', update);
  }, [query]);

  return matches;
}
