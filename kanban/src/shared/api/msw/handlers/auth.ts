import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const authHandlers = [
  // Login
  http.post('/api/auth/callback/credentials', async ({ request }) => {
    await delay(300);

    let email: string | null = null;
    let password: string | null = null;

    // Try to parse as formData first, then JSON
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      email = formData.get('email') as string;
      password = formData.get('password') as string;
    } else {
      try {
        const body = await request.json() as { email?: string; password?: string };
        email = body.email || null;
        password = body.password || null;
      } catch {
        // Fallback to trying formData
        try {
          const formData = await request.formData();
          email = formData.get('email') as string;
          password = formData.get('password') as string;
        } catch {
          // Could not parse request
        }
      }
    }

    // Demo credentials
    if (email === 'demo@example.com' && password === 'demo1234') {
      const user = mockDb.getUserByEmail(email);
      if (user) {
        // Set session in localStorage for MSW session check
        if (typeof window !== 'undefined') {
          localStorage.setItem('mock-auth-session', 'true');
        }
        return HttpResponse.json({
          url: '/',
          ok: true,
          status: 200,
        });
      }
    }

    return HttpResponse.json(
      { error: 'CredentialsSignin', url: '/login?error=CredentialsSignin' },
      { status: 200 }
    );
  }),

  // Get session
  http.get('/api/auth/session', async () => {
    await delay(100);
    const user = mockDb.getUserByEmail('demo@example.com');

    // Check if user is "logged in" (for demo purposes, always return session)
    if (typeof window !== 'undefined' && localStorage.getItem('mock-auth-session')) {
      return HttpResponse.json({
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          image: user?.image,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return HttpResponse.json({});
  }),

  // CSRF token
  http.get('/api/auth/csrf', async () => {
    await delay(50);
    return HttpResponse.json({
      csrfToken: 'mock-csrf-token',
    });
  }),

  // Providers
  http.get('/api/auth/providers', async () => {
    await delay(50);
    return HttpResponse.json({
      credentials: {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials',
        signinUrl: '/api/auth/signin/credentials',
        callbackUrl: '/api/auth/callback/credentials',
      },
    });
  }),

  // Sign out
  http.post('/api/auth/signout', async () => {
    await delay(100);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock-auth-session');
    }
    return HttpResponse.json({ url: '/' });
  }),
];
