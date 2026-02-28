import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isOnAuth = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isOnApiAuth = pathname.startsWith('/api/auth');

  if (isOnApiAuth) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isOnAuth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLoggedIn && isOnAuth) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
