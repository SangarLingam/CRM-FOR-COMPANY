import { connectDB } from "@/lib/mongodb";
import Quote from "@/models/Quote";
import { getUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status    = searchParams.get("status");

    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (status)    filter.status    = status;

    const quotes = await Quote.find(filter)
      .populate("projectId",  "projectName")
      .populate("customerId", "name phone email")
      .populate("createdBy",  "name")
      .sort({ createdAt: -1 });

    return Response.json({ quotes });

  } catch (error) {
    console.log("GET QUOTES ERROR:", error); // ← added
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const caller = getUser(req);
    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();
    console.log("QUOTE BODY:", body); // ← added
    body.createdBy = caller.id;

    const quote = await Quote.create(body);
    return Response.json({ quote }, { status: 201 });

  } catch (error) {
    console.log("POST QUOTE ERROR:", error); // ← added
    return Response.json({ error: error.message }, { status: 500 });
  }
}