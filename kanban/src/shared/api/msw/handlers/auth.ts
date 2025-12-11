import { http, HttpResponse, delay } from 'msw';
import { mockDb } from '../db';

export const authHandlers = [
  // Login
  http.post('/api/auth/callback/credentials', async ({ request }) => {
    await delay(300);
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Demo credentials
    if (email === 'demo@example.com' && password === 'demo1234') {
      const user = mockDb.getUserByEmail(email);
      if (user) {
        return HttpResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          },
        });
      }
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
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
