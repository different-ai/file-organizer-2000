import { authMiddleware, redirectToSignIn } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export default authMiddleware({
  publicRoutes: ['/api/*'],
  afterAuth: async (auth, req) => {
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    if (
      auth.userId &&
      req.nextUrl.pathname === '/members' &&
      // @ts-ignore
      auth.sessionClaims.publicMetadata?.stripe?.payment !== 'paid'
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (
      auth.userId &&
      req.nextUrl.pathname === '/members' &&
      // @ts-ignore
      auth.sessionClaims.publicMetadata?.stripe?.payment === 'paid'
    ) {
      return NextResponse.next();
    }
    if (auth.userId && req.nextUrl.pathname !== '/members') {
      return NextResponse.next();
    }
    if (auth.isPublicRoute) {
      return NextResponse.next();
    }
  },
});