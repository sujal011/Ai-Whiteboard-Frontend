import { useState } from 'react';

/**
 * Custom hook for localStorage-backed state.
 * @param {string} key - The localStorage key.
 * @param {any} initialValue - The initial value if nothing is in storage.
 * @returns {[any, Function]} [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore write errors
    }
  };

  return [storedValue, setValue];
} 