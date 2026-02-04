import { Suspense } from "react";
import { getDatabase } from "../db";
import { getModels, getFilterOptions } from "../db/queries/models";
import type { ModelFilters } from "../db/queries/models";
import { Gallery } from "../components/gallery/gallery";
import { NsfwProvider } from "../components/providers/nsfw-provider";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const db = getDatabase();

  const filters: ModelFilters = {
    page: 1,
    limit: 40,
    hasMetadata: true,
  };
  if (typeof params.search === "string") filters.search = params.search;
  if (typeof params.category === "string") filters.category = params.category;
  if (typeof params.baseModel === "string") filters.baseModel = params.baseModel;
  if (typeof params.tags === "string") filters.tags = params.tags.split(",").filter(Boolean);
  if (typeof params.sort === "string") filters.sort = params.sort as ModelFilters["sort"];
  if (params.showNoMetadata === "true") filters.hasMetadata = undefined;

  const initialData = getModels(db, filters);
  const filterOptions = getFilterOptions(db);

  return (
    <NsfwProvider>
      <Suspense>
        <Gallery initialData={initialData} initialFilters={filterOptions} />
      </Suspense>
    </NsfwProvider>
  );
}
