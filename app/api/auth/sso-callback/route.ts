import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    const secretKey = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    
    // Verify the JWT token securely signed by the Central Portal
    const { payload } = await jwtVerify(token, secretKey);

    if (!payload.userId) {
      throw new Error("Invalid token payload structure");
    }

    // Successfully Verified! Redirect to homepage and set secure session cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    
    response.cookies.set('sso-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 Days
    });

    return response;
  } catch (error) {
    console.error('SSO Token Verification Failed:', error);
    return NextResponse.redirect(
      new URL('http://localhost:3000/login?error=InvalidToken', request.url)
    );
  }
}
