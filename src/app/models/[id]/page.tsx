import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDatabase } from "../../../db";
import { getModelById } from "../../../db/queries/models";
import { ModelDetailView } from "../../../components/models/model-detail";
import { NsfwProvider } from "../../../components/providers/nsfw-provider";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = getDatabase();
  const model = getModelById(db, parseInt(id, 10));

  if (!model) return { title: "Model Not Found" };

  return {
    title: `${model.name} — Model Manager`,
    description: model.description
      ? model.description.replace(/<[^>]+>/g, "").slice(0, 160)
      : `${model.type} model: ${model.name}`,
  };
}

export default async function ModelPage({ params }: Props) {
  const { id } = await params;
  const modelId = parseInt(id, 10);

  if (isNaN(modelId)) notFound();

  const db = getDatabase();
  const model = getModelById(db, modelId);

  if (!model) notFound();

  return (
    <NsfwProvider>
      <ModelDetailView model={model} />
    </NsfwProvider>
  );
}
