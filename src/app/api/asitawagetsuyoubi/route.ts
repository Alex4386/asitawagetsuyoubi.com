import { NextResponse } from 'next/server';

import {
  createMemoryHolidayCacheStore,
  getAsitaWaGetsuyoubi,
  isAsitaWaGetsuyoubiError,
} from '@/lib/asitawagetsuyoubi';

export const runtime = 'edge';

const holidayCache = createMemoryHolidayCacheStore();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') ?? 'JP';

  try {
    const data = await getAsitaWaGetsuyoubi({
      cache: holidayCache,
      country,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const status = isAsitaWaGetsuyoubiError(error) ? error.status : 500;
    const message =
      error instanceof Error ? error.message : 'Unknown server error.';

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      },
    );
  }
}
