import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API;

export async function GET() {
    try {
        const response = await fetch(`${API_BASE_URL}/nse`);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching NSE data:', error);
        return NextResponse.json({ error: 'Failed to fetch NSE data' }, { status: 500 });
    }
}
