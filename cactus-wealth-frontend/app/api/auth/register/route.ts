import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const url = getBackendApiUrl('auth/register');

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { detail: "Error interno del servidor" },
      { status: 500 }
    );
  }
}