/**
 * Broadcast channel for notifying components when new images are uploaded.
 * This works across tabs and windows.
 */

const CHANNEL_NAME = "model-manager-uploads";

type UploadEventData = {
  type: "image-uploaded";
  modelId: number;
  imageId: number;
  timestamp: number;
};

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function notifyImageUploaded(modelId: number, imageId: number): void {
  const ch = getChannel();
  if (!ch) return;

  const data: UploadEventData = {
    type: "image-uploaded",
    modelId,
    imageId,
    timestamp: Date.now(),
  };
  ch.postMessage(data);
}

export function subscribeToUploads(
  callback: (data: UploadEventData) => void
): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<UploadEventData>) => {
    if (event.data?.type === "image-uploaded") {
      callback(event.data);
    }
  };

  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}
