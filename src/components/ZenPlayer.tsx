import { useEffect, useMemo } from "react";

type Props = {
  active: boolean;
};

// Hidden YouTube embed to play lofi while in Zen Mode.
// Note: You can swap the videoId to any lofi/chill live stream.
// Defaults use commonly known 24/7 lofi live stream IDs.
const CANDIDATE_VIDEO_IDS = [
  "jfKfPfyJRdk", // Lofi Girl (commonly referenced live ID)
  "DWcJFNfaw9c", // freeCodeCamp lofi live (fallback)
];

export default function ZenPlayer({ active }: Props) {
  const src = useMemo(() => {
    const id = CANDIDATE_VIDEO_IDS[0];
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "0",
      controls: "0",
      playsinline: "1",
      modestbranding: "1",
      rel: "0",
      loop: "1",
    });
    // loop a single video requires playlist param equal to the video id
    params.set("playlist", id);
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  }, []);

  useEffect(() => {
    // Nothing to do here; mounting/unmounting iframe is enough.
  }, [active]);

  if (!active) return null;

  return (
    <div aria-hidden style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <iframe
        title="Zen Lofi Player"
        width="0"
        height="0"
        src={src}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen={false}
        frameBorder={0}
      />
    </div>
  );
}
