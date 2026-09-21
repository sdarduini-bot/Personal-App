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

    let trialDaysRemaining: number | null = null;
    if (trainer.trialEndsAt) {
      const diffMs = new Date(trainer.trialEndsAt).getTime() - Date.now();
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      authenticated: true,
      trainer: {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        pixKey: trainer.pixKey,
        bio: trainer.bio,
        themePreference: trainer.themePreference,
        subscriptionStatus: trainer.subscriptionStatus,
        trialEndsAt: trainer.trialEndsAt,
        trialDaysRemaining,
      },
    });
  } catch (error) {
    console.error("Erro status auth:", error);
    return NextResponse.json({ authenticated: false, trainer: null });
  }
}
