// src/routes/api/auth/login/+server.js
import { json } from '@sveltejs/kit';
import { loginUser, recordLoginAttempt, checkRateLimit, getJwtCookieOptions } from '$lib/server/auth/auth';
import { authRateLimiter } from '$lib/server/auth/ratelimit';

export async function POST({ request, cookies }) {
  // Apply rate limiting
  const rateLimitResponse = authRateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  try {
    const { email, password, rememberMe } = await request.json();
    console.log('API /auth/login attempt', { email, rememberMe });
    
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit for login attempts
    const isRateLimited = await checkRateLimit(email, ip);
    if (isRateLimited) {
      return json(
        { 
          success: false, 
          message: 'Too many login attempts. Please try again later.' 
        }, 
        { status: 429 }
      );
    }
    
    // Record login attempt
    await recordLoginAttempt(email, ip);
    
    // Attempt to log in user
    const { token, user } = await loginUser(email, password);
    console.log('API /auth/login success', { user: user.email });
    
    // Set JWT cookie
    const cookieOptions = getJwtCookieOptions();
    
    // If remember me is checked, extend cookie lifetime to 30 days
    if (rememberMe) {
      cookieOptions.maxAge = 60 * 60 * 24 * 30 * 1000; // 30 days
    }
    
    cookies.set('authToken', token, cookieOptions);
    console.log('API /auth/login cookie set', { cookieOptions });
    
    return json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('API /auth/login error:', error);
    
    // Return a generic error for security
    return json(
      { 
        success: false, 
        message: 'Invalid credentials' 
      }, 
      { status: 401 }
    );
  }
}