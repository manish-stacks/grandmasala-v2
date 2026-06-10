import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7500/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Server-side fetcher (for SSR/SSG)
export async function serverFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// No-cache server fetch (for dynamic data)
export async function serverFetchNoCache<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const API_BASE = API_URL;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.grandmasala.in';
