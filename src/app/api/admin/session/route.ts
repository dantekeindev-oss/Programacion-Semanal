import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminAuth';

export async function GET(req: Request) {
  const authResult = requireAdminSession(req);

  if ('error' in authResult) {
    return authResult.error;
  }

  return NextResponse.json({
    success: true,
    data: authResult.session,
  });
}
