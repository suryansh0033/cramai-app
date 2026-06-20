import { auth } from "@clerk/nextjs/server";
import { connectDB } from "../../../lib/mongodb";
import History from "../../../models/History";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, syllabusInput, generatedContent, title } = body;

  await connectDB();
  const entry = await History.create({
    userId,
    type,
    syllabusInput,
    generatedContent,
    title,
  });

  return Response.json({ success: true, entry });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const history = await History.find({ userId }).sort({ createdAt: -1 }).limit(50);

  return Response.json({ history });
}