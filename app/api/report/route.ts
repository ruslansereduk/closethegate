export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[REPORT]', new Date().toISOString(), body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}


