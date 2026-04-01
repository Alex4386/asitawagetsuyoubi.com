import { NextResponse } from 'next/server';

import {
  createMemoryHolidayCacheStore,
  DEFAULT_COUNTRY,
  getAsitaWaGetsuyoubi,
  isAsitaWaGetsuyoubiError,
  parseReferenceDate,
} from '@/lib/asitawagetsuyoubi';

export const runtime = 'edge';

const holidayCache = createMemoryHolidayCacheStore();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') ?? DEFAULT_COUNTRY;
  const referenceDate = parseReferenceDate(searchParams.get('at'));

  try {
    const data = await getAsitaWaGetsuyoubi({
      cache: holidayCache,
      country,
      now: referenceDate ?? undefined,
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
