import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return new NextResponse('Query parameter "q" is required', { status: 400 });
    }

    // Default to the user's provided secret key if not available in env
    const secretKey = process.env.LOGO_DEV_SECRET_KEY || "sk_Mo0_c3IGT6KEiv5r1iyUOw";
    
    try {
        const response = await fetch(`https://api.logo.dev/search?q=${encodeURIComponent(query)}`, {
            headers: {
                "Authorization": `Bearer ${secretKey}`
            },
            next: { revalidate: 86400 } // Cache results for 24 hours to reduce backend overhead
        });

        if (!response.ok) {
            return new NextResponse('Failed to fetch from logo.dev search API', { status: response.status });
        }

        const data = await response.json();
        
        // Ensure we got an array back with at least one result containing a logo_url
        if (Array.isArray(data) && data.length > 0 && (data[0].logo_url || data[0].logoUrl)) {
            const finalLogoUrl = data[0].logo_url || data[0].logoUrl;
            // Send a 302 Redirect to the image URL so the <img> tag loads it directly
            return NextResponse.redirect(finalLogoUrl, {
                status: 302,
                headers: {
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                },
            });
        }

        return new NextResponse('No logo found for the given query', { status: 404 });
    } catch (error) {
        console.error('Logo.dev search error:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
