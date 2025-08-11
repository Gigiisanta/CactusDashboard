import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    
    const response = await fetch(`${backendUrl}/api/v1/managers/`, {
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