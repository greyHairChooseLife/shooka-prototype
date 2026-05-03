import { NextResponse } from 'next/server';
import { getUsage } from '@/lib/counter';

export async function GET() {
    const usage = getUsage();
    return NextResponse.json(usage);
}
