/**
 * useApi - React hooks for API management
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { QueryState, MutationState } from '../types';

interface UseQueryOptions<T> {
  /** Initial data */
  initialData?: T;
  /** Skip initial fetch */
  skip?: boolean;
  /** Refetch on window focus */
  refetchOnFocus?: boolean;
  /** Refetch interval in ms */
  refetchInterval?: number;
  /** Cache time in ms */
  cacheTime?: number;
  /** Stale time in ms */
  staleTime?: number;
  /** On success callback */
  onSuccess?: (data: T) => void;
  /** On error callback */
  onError?: (error: Error) => void;
}

interface UseMutationOptions<T> {
  /** On success callback */
  onSuccess?: (data: T) => void;
  /** On error callback */
  onError?: (error: Error) => void;
  /** On settled callback (success or error) */
  onSettled?: () => void;
}

/**
 * Fetch data with automatic state management
 * 
 * @example
 * ```tsx
 * function UserList() {
 *   const { data, loading, error, refetch } = useQuery(
 *     () => fetch('/api/users').then(r => r.json()),
 *     { refetchOnFocus: true }
 *   );
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return (
 *     <ul>
 *       {data?.map(user => <li key={user.id}>{user.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): QueryState<T> {
  const {
    initialData = null,
    skip = false,
    refetchOnFocus = false,
    refetchInterval,
    staleTime = 0,
    onSuccess,
    onError,
  } = options;
  
  const [data, setData] = useState<T | null>(initialData as T | null);
  const [loading, setLoading] = useState(!skip && !initialData);
  const [error, setError] = useState<Error | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  
  const isStale = useCallback(() => {
    if (!fetchedAt) return true;
    return Date.now() - fetchedAt > staleTime;
  }, [fetchedAt, staleTime]);
  
  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcherRef.current();
      setData(result);
      setFetchedAt(Date.now());
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);
  
  // Initial fetch
  useEffect(() => {
    if (!skip) {
      fetch();
    }
  }, [skip, fetch]);
  
  // Refetch on focus
  useEffect(() => {
    if (!refetchOnFocus) return;
    
    const handleFocus = () => {
      if (isStale()) {
        fetch();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, fetch, isStale]);
  
  // Refetch interval
  useEffect(() => {
    if (!refetchInterval) return;
    
    const interval = setInterval(fetch, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, fetch]);
  
  return {
    data,
    loading,
    error,
    stale: isStale(),
    fetchedAt,
    refetch: fetch,
  };
}

/**
 * Handle mutations with loading/error state
 * 
 * @example
 * ```tsx
 * function CreateUserForm() {
 *   const { mutate, loading, error } = useMutation(
 *     (data) => fetch('/api/users', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     }).then(r => r.json()),
 *     {
 *       onSuccess: (user) => navigate(`/users/${user.id}`),
 *     }
 *   );
 *   
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       mutate({ name: e.target.name.value });
 *     }}>
 *       <input name="name" />
 *       <button disabled={loading}>
 *         {loading ? 'Creating...' : 'Create User'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData> = {}
): MutationState<TData> & { mutate: (variables: TVariables) => Promise<TData | undefined> } {
  const { onSuccess, onError, onSettled } = options;
  
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;
  
  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mutationFnRef.current(variables);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      return undefined;
    } finally {
      setLoading(false);
      onSettled?.();
    }
  }, [onSuccess, onError, onSettled]);
  
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);
  
  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}

/**
 * Simplified API hook for common REST operations
 * 
 * @example
 * ```tsx
 * function UserPage({ userId }) {
 *   const api = useApi('/api/users');
 *   
 *   const { data: user, loading } = api.get(`/${userId}`);
 *   
 *   const { mutate: updateUser } = api.put(`/${userId}`, {
 *     onSuccess: () => toast.success('User updated!'),
 *   });
 *   
 *   return (
 *     <UserForm
 *       user={user}
 *       loading={loading}
 *       onSubmit={updateUser}
 *     />
 *   );
 * }
 * ```
 */
export function useApi(baseUrl: string) {
  const get = useCallback(<T>(path: string, options?: UseQueryOptions<T>) => {
    return useQuery<T>(() => 
      fetch(`${baseUrl}${path}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      options
    );
  }, [baseUrl]);
  
  const post = useCallback(<T, V = unknown>(
    path: string, 
    options?: UseMutationOptions<T>
  ) => {
    return useMutation<T, V>(
      (data) => fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      options
    );
  }, [baseUrl]);
  
  const put = useCallback(<T, V = unknown>(
    path: string, 
    options?: UseMutationOptions<T>
  ) => {
    return useMutation<T, V>(
      (data) => fetch(`${baseUrl}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      options
    );
  }, [baseUrl]);
  
  const del = useCallback(<T>(path: string, options?: UseMutationOptions<T>) => {
    return useMutation<T, void>(
      () => fetch(`${baseUrl}${path}`, {
        method: 'DELETE',
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      options
    );
  }, [baseUrl]);
  
  return { get, post, put, delete: del };
}

