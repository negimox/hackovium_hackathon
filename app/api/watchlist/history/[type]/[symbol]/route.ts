import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string; symbol: string }> }
) {
    try {
        const { type, symbol } = await params;
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '1y';
        const interval = searchParams.get('interval') || '1d';

        if (type === "fund" || type === "amfi") {
            // Fetch from mfapi.in
            const res = await fetch(`https://api.mfapi.in/mf/${symbol}`);
            const json = await res.json();
            
            if (!json.data) {
                return NextResponse.json({ error: 'Fund data not found', bars: [] });
            }

            // Map DD-MM-YYYY to unix timestamp and create bars
            const bars = json.data.map((d: any) => {
                const parts = d.date.split('-');
                const time = Math.floor(new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`).getTime() / 1000);
                const val = parseFloat(d.nav);
                return {
                    time,
                    open: val,
                    high: val,
                    low: val,
                    close: val,
                    volume: 0
                };
            }).sort((a: any, b: any) => a.time - b.time);

            // Basic filtering for period (optional optimization)
            // For now, return all and let frontend handle it or just the sliced amount
            return NextResponse.json({ bars });
        }

        const response = await fetch(
            `${API_BASE_URL}/history/${type.toLowerCase()}/${symbol}?period=${period}&interval=${interval}`
        );
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching history data:', error);
        return NextResponse.json({ error: 'Failed to fetch history data', bars: [] }, { status: 500 });
    }
}
