import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend";

export async function GET(_request: NextRequest) {
  try {
    const url = getBackendApiUrl('managers/');

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error obteniendo managers:", error);
    return NextResponse.json(
      { detail: "Error interno del servidor" },
      { status: 500 }
    );
  }
}