import { NextResponse } from 'next/server';
import { getSsoUser } from '@/lib/getSsoUser';

export async function GET() {
  const user = await getSsoUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
