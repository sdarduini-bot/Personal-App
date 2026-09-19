import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get("pedro_pt_session");

    const authenticated = await verifySessionToken(session?.value);

    let trainer = null;
    if (authenticated) {
      trainer = await prisma.trainerSettings.findUnique({
        where: { id: "trainer" },
        select: {
          name: true,
          phone: true,
          pixKey: true,
          bio: true,
          themePreference: true,
        },
      });
    }

    return NextResponse.json({
      authenticated,
      trainer,
    });
  } catch (error) {
    console.error("Erro status auth:", error);
    return NextResponse.json({ authenticated: false, trainer: null });
  }
}
