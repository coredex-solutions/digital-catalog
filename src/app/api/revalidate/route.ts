import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { requireAuth } from "../../../../lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = requireAuth(request);
    if ("error" in auth) {
      return auth.error;
    }

    const { path, type } = await request.json();

    if (type === "path") {
      revalidatePath(path);
    } else if (type === "page") {
      revalidatePath(path, "page");
    } else {
      // Revalidate all dynamic pages
      revalidatePath("/categories", "page");
      revalidatePath("/menu/[categoryId]", "page");
      revalidatePath("/", "page");
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Error revalidating" }, { status: 500 });
  }
}
