import { NextResponse } from "next/server";
import { getTrainerSession } from "@/lib/auth-trainer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const trainer = await getTrainerSession();

    if (!trainer) {
      return NextResponse.json({
        authenticated: false,
        trainer: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      trainer: {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        isActive: trainer.isActive,
        phone: trainer.phone,
        pixKey: trainer.pixKey,
        bio: trainer.bio,
        themePreference: trainer.themePreference,
      },
    });
  } catch (error) {
    console.error("Erro status auth:", error);
    return NextResponse.json({ authenticated: false, trainer: null });
  }
}
