/**
 * Library Integration Hook
 *
 * Hook for managing library panel state with localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kaya-show-library';

export function useLibraryPanel() {
  // Load saved preference from localStorage
  const [showLibrary, setShowLibrary] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    }
    return false;
  });

  // Save preference when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, String(showLibrary));
    }
  }, [showLibrary]);

  // Toggle function
  const toggleLibrary = useCallback(() => {
    setShowLibrary(prev => !prev);
  }, []);

  // Keyboard shortcut: Ctrl+L or Cmd+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l' && !e.shiftKey) {
        e.preventDefault();
        toggleLibrary();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLibrary]);

  return {
    showLibrary,
    setShowLibrary,
    toggleLibrary,
  };
}
