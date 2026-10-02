import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/auth';

export async function POST() {
  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(cookieOptions.name);
  return response;
}
