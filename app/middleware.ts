import { authMiddleware, redirectToSignIn } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export default authMiddleware({
    publicRoutes: (req) => req.url.includes("/api"),
  afterAuth: async (auth, req) => {
    console.log('in after auth')
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

      console.log(auth.sessionClaims.publicMetadata)
    if (
      auth.userId &&
      req.nextUrl.pathname === '/members' &&
      // @ts-ignore
      auth.sessionClaims.publicMetadata?.stripe?.payment !== 'paid'
    ) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    console.log('new')
    if (
      auth.userId &&
      req.nextUrl.pathname === '/members' &&
      // @ts-ignore
      auth.sessionClaims.publicMetadata?.stripe?.payment === 'paid'
    ) {
      return NextResponse.next();
    }
    console.log('members')
    if (auth.userId && req.nextUrl.pathname !== '/members') {
      return NextResponse.next();
    }
    if (auth.isPublicRoute) {
      console.log(' is public route')
      return NextResponse.next();
    }
  },
});