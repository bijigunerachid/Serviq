
import { NextResponse } from 'next/server';

const VERIFY_URL =
  'http://127.0.0.1:3000/api/auth/verify-email';

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  // Do not accept large request bodies.
  const contentLength = Number(
    request.headers.get('content-length') ?? 0,
  );

  if (contentLength > 2048) {
    return jsonResponse(
      { code: 'INVALID_REQUEST' },
      413,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { code: 'INVALID_REQUEST' },
      400,
    );
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    !('token' in body) ||
    typeof body.token !== 'string' ||
    !TOKEN_PATTERN.test(body.token)
  ) {
    return jsonResponse(
      { code: 'INVALID_TOKEN' },
      400,
    );
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: body.token,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return jsonResponse(
        {
          success: true,
          code: 'EMAIL_VERIFIED',
        },
        200,
      );
    }

    if (response.status === 429) {
      return jsonResponse(
        { code: 'RATE_LIMITED' },
        429,
      );
    }

    if (response.status === 400) {
      return jsonResponse(
        { code: 'INVALID_OR_EXPIRED_TOKEN' },
        400,
      );
    }

    return jsonResponse(
      { code: 'VERIFICATION_UNAVAILABLE' },
      502,
    );
  } catch {
    return jsonResponse(
      { code: 'VERIFICATION_UNAVAILABLE' },
      503,
    );
  }
}
