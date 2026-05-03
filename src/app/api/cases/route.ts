import { NextResponse } from 'next/server';
import { listCaseMetas } from '@/lib/cache';

export async function GET() {
    const cases = listCaseMetas();
    return NextResponse.json(cases);
}
