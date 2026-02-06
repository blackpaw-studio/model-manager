import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDatabase } from "../../../../db";
import { models, userNotes } from "../../../../db/schema";
import { getModelById } from "../../../../db/queries/models";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const modelId = parseInt(id, 10);

  if (isNaN(modelId)) {
    return NextResponse.json({ error: "Invalid model ID" }, { status: 400 });
  }

  const db = getDatabase();
  const model = getModelById(db, modelId);

  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  return NextResponse.json(model);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const modelId = parseInt(id, 10);

  if (isNaN(modelId)) {
    return NextResponse.json({ error: "Invalid model ID" }, { status: 400 });
  }

  const db = getDatabase();
  const model = getModelById(db, modelId);

  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  // Only allow updating certain fields
  if (body.baseModel !== undefined) {
    updates.baseModel = body.baseModel || null;
  }
  if (body.type !== undefined) {
    updates.type = body.type;
  }
  if (body.name !== undefined) {
    updates.name = body.name;
  }

  // Handle notes separately (stored in user_notes table)
  if (body.notes !== undefined) {
    const now = new Date().toISOString();
    const existingNote = db
      .select()
      .from(userNotes)
      .where(eq(userNotes.modelId, modelId))
      .get();

    if (body.notes === null || body.notes === "") {
      // Delete note if empty
      if (existingNote) {
        db.delete(userNotes).where(eq(userNotes.modelId, modelId)).run();
      }
    } else if (existingNote) {
      // Update existing note
      db.update(userNotes)
        .set({ content: body.notes, updatedAt: now })
        .where(eq(userNotes.modelId, modelId))
        .run();
    } else {
      // Create new note
      db.insert(userNotes)
        .values({
          modelId,
          content: body.notes,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  }

  if (Object.keys(updates).length > 0) {
    db.update(models)
      .set(updates)
      .where(eq(models.id, modelId))
      .run();
  }

  // Return updated model
  const updated = getModelById(db, modelId);
  return NextResponse.json(updated);
}
