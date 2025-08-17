// Simple zen music controller using public chill/lofi radio streams.
// Tries multiple sources until one plays.

let zenAudio: HTMLAudioElement | null = null;
let currentSrcIndex = 0;

// Curated chill/lofi-like streams (subject to availability)
// Prefer user's requested Groove Salad 256kbps endpoints first.
const ZEN_SOURCES: string[] = [
	// SomaFM Groove Salad 256kbps (user-provided)
	"https://ice5.somafm.com/groovesalad-256-mp3",
	"https://ice6.somafm.com/groovesalad-256-mp3",
	// Fallbacks
	"https://ice2.somafm.com/groovesalad-128-mp3",
	"https://ice2.somafm.com/beatblender-128-mp3",
	"https://stream.nightride.fm/lofi.mp3",
];

const createAudio = (src: string, volume = 0.35) => {
	const a = new Audio(src);
	a.crossOrigin = "anonymous";
	a.preload = "none"; // don't preload, start on demand
	a.loop = false; // streams are continuous
	a.volume = volume;
	a.autoplay = false;
	return a;
};

export async function startZenMusic(volume = 0.35): Promise<boolean> {
	if (zenAudio) return true; // already playing/started
	for (let i = 0; i < ZEN_SOURCES.length; i++) {
		const src = ZEN_SOURCES[i];
		try {
			const a = createAudio(src, volume);
			// Some browsers need a user gesture to play; ideally call within a gesture.
			await a.play();
			zenAudio = a;
			currentSrcIndex = i;
			// Auto try next source on error (e.g., if stream ends)
			a.addEventListener("error", tryNextSource);
			return true;
		} catch {
			// Try the next source
			continue;
		}
	}
	return false;
}

function tryNextSource() {
	if (!zenAudio) return;
	const vol = zenAudio.volume;
	zenAudio.removeEventListener("error", tryNextSource);
	try {
		zenAudio.pause();
	} catch {
		// ignore pause errors
	}
	zenAudio = null;
	const next = (currentSrcIndex + 1) % ZEN_SOURCES.length;
	currentSrcIndex = next;
	void startZenMusic(vol);
}

export function stopZenMusic() {
	if (!zenAudio) return;
	try {
		zenAudio.removeEventListener("error", tryNextSource);
		zenAudio.pause();
		// Clearing src helps some mobile browsers fully stop
		zenAudio.src = "";
	} catch {
		// ignore teardown errors
	}
	zenAudio = null;
}

export function setZenVolume(volume: number) {
	if (zenAudio) zenAudio.volume = Math.max(0, Math.min(1, volume));
}

export function isZenMusicActive() {
	return !!zenAudio;
}
