/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				"frog-green": {
					100: "#f0f9f0",
					200: "#dcf2dc",
					300: "#b8e6b8",
					400: "#85d485",
					500: "#4ade80",
					600: "#16a34a",
					700: "#15803d",
					800: "#166534",
					900: "#14532d",
				},
				"wizard-purple": {
					100: "#f3e8ff",
					200: "#e9d5ff",
					300: "#d8b4fe",
					400: "#c084fc",
					500: "#a855f7",
					600: "#9333ea",
					700: "#7c3aed",
					800: "#6b21a8",
					900: "#581c87",
				},
				"magic-gold": {
					100: "#fef3c7",
					200: "#fde68a",
					300: "#fcd34d",
					400: "#fbbf24",
					500: "#f59e0b",
					600: "#d97706",
					700: "#b45309",
					800: "#92400e",
					900: "#78350f",
				},
			},
			animation: {
				"bounce-slow": "bounce 2s infinite",
				"pulse-fast": "pulse 0.5s infinite",
				wiggle: "wiggle 1s ease-in-out infinite",
				float: "float 3s ease-in-out infinite",
				sparkle: "sparkle 1.5s ease-in-out infinite",
			},
			keyframes: {
				wiggle: {
					"0%, 100%": { transform: "rotate(-3deg)" },
					"50%": { transform: "rotate(3deg)" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-10px)" },
				},
				sparkle: {
					"0%, 100%": { opacity: "0", transform: "scale(0)" },
					"50%": { opacity: "1", transform: "scale(1)" },
				},
			},
		},
	},
	plugins: [],
};
