import { auth } from "@clerk/nextjs/server";
import { connectDB } from "../../../../lib/mongodb";
import PYQ from "../../../../models/PYQ";
import { isAdmin } from "../../../../lib/isAdmin";

export async function GET() {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const pending = await PYQ.find({ status: "pending" }).sort({ createdAt: 1 });

  return Response.json({ pending });
}