import { useEffect } from 'react';

const BRAND = 'AjoLedger';

/**
 * usePageTitle(title)
 * Sets document.title to "<title> | AjoLedger".
 * Pass null/undefined to use just "AjoLedger".
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BRAND}` : BRAND;
    return () => {
      document.title = BRAND;
    };
  }, [title]);
}
