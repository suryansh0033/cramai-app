import { auth } from "@clerk/nextjs/server";
import { connectDB } from "../../../../../lib/mongodb";
import PYQ from "../../../../../models/PYQ";
import { isAdmin } from "../../../../../lib/isAdmin";

export async function PATCH(req, { params }) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, rejectionReason } = await req.json();

  if (!["approved", "rejected"].includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectDB();
  const entry = await PYQ.findByIdAndUpdate(
    id,
    { status, rejectionReason, reviewedAt: new Date() },
    { new: true }
  );

  return Response.json({ success: true, entry });
}