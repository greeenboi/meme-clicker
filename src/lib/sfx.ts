import CRAZY_FROG from "../assets/sfx/crazy-frog.mp3";
import CROAKFEST from "../assets/sfx/croakfest.mp3";
import FROG_MOAN from "../assets/sfx/frog-moan.mp3";
import GAY_FROGS from "../assets/sfx/gay-frogs.mp3";
import HAHAHA_FROG from "../assets/sfx/hahaha-frog.mp3";
// Lightweight SFX helper – Vite will bundle these as assets
import SINGLE_CROAK from "../assets/sfx/single-croak.mp3";
import SQUEAK from "../assets/sfx/squeak.mp3";
import CRIT from "../assets/sfx/crit.mp3";

// Play a sound without blocking UI; catch to suppress autoplay errors
function play(src: string, volume = 1.0) {
	try {
		const audio = new Audio(src);
		audio.volume = volume;
		// Do not await; fire-and-forget
		void audio.play().catch(() => {});
	} catch {
		// ignore audio errors (e.g., autoplay restrictions)
	}
}

// Returns true with given probability (0..1)
const chance = (p: number) => Math.random() < p;

export function playClickSfx(totalClicks: number) {
	// Base sound every click
	play(SINGLE_CROAK, 0.7);

	// Small random alt at all levels
	if (chance(0.04))
		play(SQUEAK, 0.9); // ~4%
	else if (chance(0.02)) play(CROAKFEST, 0.8); // ~2%

	// Unlock tier 2 after >500 clicks
	if (totalClicks > 500) {
		if (chance(0.015))
			play(FROG_MOAN, 0.8); // 1.5%
		else if (chance(0.008)) play(CRAZY_FROG, 0.85); // 0.8%
	}

	// Unlock tier 3 after >2000 clicks
	if (totalClicks > 2000) {
		if (chance(0.006))
			play(GAY_FROGS, 0.85); // 0.6%
		else if (chance(0.004)) play(HAHAHA_FROG, 0.85); // 0.4%
	}
}

export function playCritSfx() {
	play(CRIT, 0.9);
}
