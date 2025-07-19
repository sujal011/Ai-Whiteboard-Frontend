import { useState, useCallback } from 'react';

/**
 * Custom hook to handle async requests with loading and error state.
 * @returns {Object} { execute, loading, error }
 */
export function useAsyncRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFn, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  return { execute, loading, error };
} 