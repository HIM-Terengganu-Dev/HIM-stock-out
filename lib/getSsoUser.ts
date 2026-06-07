import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export interface SsoUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  company: string | null;
}

export async function getSsoUser(): Promise<SsoUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sso-session');
    if (!token) return null;

    const secretKey = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token.value, secretKey);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: (payload.role as string) || 'member',
      company: (payload.company as string) || null,
    };
  } catch {
    return null;
  }
}
