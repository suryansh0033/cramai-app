import { auth } from "@clerk/nextjs/server";
import { connectDB } from "../../../lib/mongodb";
import PYQ from "../../../models/PYQ";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { college, branch, subject, semester, year, fileUrl, fileType, uploaderName } = body;

  await connectDB();
  const entry = await PYQ.create({
    college,
    branch,
    subject,
    semester,
    year,
    fileUrl,
    fileType,
    uploadedBy: userId,
    uploaderName,
  });

  return Response.json({ success: true, entry });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const college = searchParams.get("college");
  const branch = searchParams.get("branch");
  const subject = searchParams.get("subject");

  const filter = { status: "approved" };
  if (college) filter.college = college;
  if (branch) filter.branch = branch;
  if (subject) filter.subject = subject;

  await connectDB();
  const results = await PYQ.find(filter).sort({ createdAt: -1 }).limit(100);

  return Response.json({ results });
}