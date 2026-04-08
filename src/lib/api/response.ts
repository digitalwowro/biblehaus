import { NextResponse } from "next/server";

export function success(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function error(
  message: string,
  code: string,
  status: number = 400
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}
