import { BACKEND_URL } from '../config';

/**
 * Enhanced fetch wrapper that auto-injects auth tokens and handles common errors.
 */
export async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');

    // Ensure endpoint starts with /api if not present
    let url = endpoint;
    if (!url.startsWith('http')) {
        const path = url.startsWith('/') ? url : `/${url}`;
        url = `${BACKEND_URL}${path}`;
    }

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            // We'll let the AuthContext handle redirection via state
        }

        return response;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}
