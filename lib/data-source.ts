/**
 * Data Source Helper
 *
 * Provides a unified interface for fetching data from either:
 * - Mock data (when E2E_MOCK_DATA=true)
 * - JSONPlaceholder API (when E2E_MOCK_DATA=false or undefined)
 *
 * This abstraction allows the same codebase to run with zero external
 * dependencies for E2E testing while still supporting real API calls
 * in development/demo mode.
 */

import { MOCK_POSTS, MOCK_USERS, type MockPost, type MockUser } from './mock-data';

// Check environment variable once at module load time
const USE_MOCK_DATA = process.env.E2E_MOCK_DATA === 'true';

// Log mode on first import (helps with debugging)
if (typeof window === 'undefined') {
  console.log(`[DataSource] Mode: ${USE_MOCK_DATA ? 'MOCK' : 'REAL'} (E2E_MOCK_DATA=${process.env.E2E_MOCK_DATA})`);
}

// ============================================================================
// Posts
// ============================================================================

/**
 * Fetch all posts from data source
 */
export async function getPosts(): Promise<MockPost[]> {
  if (USE_MOCK_DATA) {
    console.log('[DataSource] Returning mock posts');
    return MOCK_POSTS;
  }

  console.log('[DataSource] Fetching posts from JSONPlaceholder');
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single post by ID
 */
export async function getPost(id: number): Promise<MockPost | null> {
  if (USE_MOCK_DATA) {
    console.log(`[DataSource] Returning mock post ${id}`);
    return MOCK_POSTS.find(p => p.id === id) || null;
  }

  console.log(`[DataSource] Fetching post ${id} from JSONPlaceholder`);
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

// ============================================================================
// Users
// ============================================================================

/**
 * Fetch all users from data source
 */
export async function getUsers(): Promise<MockUser[]> {
  if (USE_MOCK_DATA) {
    console.log('[DataSource] Returning mock users');
    return MOCK_USERS;
  }

  console.log('[DataSource] Fetching users from JSONPlaceholder');
  const response = await fetch('https://jsonplaceholder.typicode.com/users');

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single user by ID
 */
export async function getUser(id: number): Promise<MockUser | null> {
  if (USE_MOCK_DATA) {
    console.log(`[DataSource] Returning mock user ${id}`);
    return MOCK_USERS.find(u => u.id === id) || null;
  }

  console.log(`[DataSource] Fetching user ${id} from JSONPlaceholder`);
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);

  if (!response.ok) {
    return null;
  }

  return response.json();
}

// ============================================================================
// Combined (for SSG demo page)
// ============================================================================

/**
 * Fetch posts and users together (for SSG demo)
 */
export async function getPostsAndUsers(): Promise<{ posts: MockPost[]; users: MockUser[] }> {
  const [posts, users] = await Promise.all([
    getPosts(),
    getUsers()
  ]);

  return { posts, users };
}

// ============================================================================
// Helper to check mode
// ============================================================================

/**
 * Returns true if mock data mode is active
 */
export function isMockMode(): boolean {
  return USE_MOCK_DATA;
}
