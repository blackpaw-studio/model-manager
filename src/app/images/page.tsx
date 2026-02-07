import { NsfwProvider } from "@/components/providers/nsfw-provider";
import { ImagesFeed } from "@/components/images/images-feed";

export const dynamic = "force-dynamic";

export default function ImagesPage() {
  return (
    <NsfwProvider>
      <ImagesFeed />
    </NsfwProvider>
  );
}
