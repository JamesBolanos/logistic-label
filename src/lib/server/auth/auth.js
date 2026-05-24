// src/lib/server/auth/auth.js
import { json } from '@sveltejs/kit';
import crypto from 'crypto';

const users = new Map();
const loginAttempts = new Map();

// Create a default test user for development
if (users.size === 0) {
  const testUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    username: 'testuser',
    full_name: 'Test User',
    role: 'user',
    password: 'password123'
  };
  users.set(testUser.email, testUser);
}

export function getJwtCookieOptions() {
  return {
    path: '/',
    // Note: httpOnly is disabled so the client-side ProtectedRoute check can read the cookie in dev.
    // For production, set this back to true and perform auth on the server/load.
    httpOnly: false,
    sameSite: 'lax',
    secure: false
  };
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  // In a real app, verify JWT signature. Here we decode a mocked token format.
  if (token.startsWith('mock-token-')) {
    const id = token.replace('mock-token-', '');
    const user = Array.from(users.values()).find((u) => u.id === id);
    return user || { id, email: 'mock@example.com', username: 'mock', full_name: 'Mock User', role: 'user' };
  }
  return null;
}

export async function loginUser(email, password) {
  const user = users.get(email);
  if (!user || user.password !== password) {
    throw new Error('Invalid credentials');
  }
  return {
    token: `mock-token-${user.id}`,
    user
  };
}

export async function registerUser(userData) {
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const user = {
    id,
    email: userData.email,
    username: userData.username,
    full_name: userData.full_name || userData.username,
    role: 'user',
    password: userData.password
  };
  users.set(user.email, user);
  return user;
}

export async function recordLoginAttempt(email, ip) {
  loginAttempts.set(`${email}:${ip}`, Date.now());
}

export async function checkRateLimit(email, ip) {
  // Simple no-op limiter; always allow in this stub
  return false;
}

export async function logUserActivity(userId, action, metadata = {}, ip = 'unknown', userAgent = '') {
  console.info('User activity', { userId, action, metadata, ip, userAgent });
}

export function unauthorized(message = 'Unauthorized') {
  return json({ success: false, message }, { status: 401 });
}

export default {
  getJwtCookieOptions,
  verifyToken,
  loginUser,
  registerUser,
  recordLoginAttempt,
  checkRateLimit,
  logUserActivity,
  unauthorized
};
