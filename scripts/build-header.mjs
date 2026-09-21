// Builds assets/header-light.svg and assets/header-dark.svg from one template.
//
// Two files because GitHub picks between them with <picture> and its own theme
// setting. A single SVG with a prefers-color-scheme query would follow the OS
// instead, and show the wrong one to anyone whose GitHub theme differs.
//
// The serif is embedded as base64. An SVG shown through <img> cannot fetch
// fonts, so without it the name falls back to whatever serif the visitor has.
// Instrument Serif, SIL Open Font License 1.1; the licence travels in the
// font's own name table.
//
// Run: node scripts/build-header.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const font = readFileSync(
	join(root, "assets/fonts/instrument-serif-latin.woff2"),
).toString("base64");

// The site's palettes, copied from src/app/globals.css in the portfolio repo.
const THEMES = {
	light: {
		paper: "#f2f0ee",
		rule: "#dedbd7",
		ink: "#2b2929",
		soft: "#464342",
		muted: "#58595b",
		accent: "#c23325",
		star: "#48597a",
	},
	dark: {
		paper: "#14161b",
		rule: "#272c35",
		ink: "#eceef2",
		soft: "#c5c9d1",
		muted: "#98a0ac",
		accent: "#f3877e",
		star: "#9fb2d4",
	},
};

// Seeded, so a rebuild draws the same sky and the diff stays readable.
function mulberry32(seed) {
	let a = seed;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// The constellation, placed by hand. Kept to the right so it never sits
// behind the name.
const STARS = [
	[812, 104, 3.2],
	[884, 66, 2.6],
	[958, 126, 3.6],
	[1038, 84, 2.8],
	[1110, 142, 3.0],
	[1068, 226, 3.4],
	[974, 252, 2.6],
	[896, 210, 3.0],
	[1136, 284, 2.2],
];
const LINES = [
	[0, 1],
	[1, 2],
	[2, 3],
	[3, 4],
	[4, 5],
	[5, 6],
	[6, 7],
	[7, 2],
	[5, 8],
];

const rand = mulberry32(2026);
const DUST = Array.from({ length: 34 }, () => [
	Math.round(640 + rand() * 530),
	Math.round(28 + rand() * 284),
	+(0.7 + rand() * 1.1).toFixed(2),
	+(0.18 + rand() * 0.32).toFixed(2),
]);

const SERIF = `'Instrument Serif', Georgia, 'Times New Roman', serif`;
const SANS = `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

function svg(t) {
	const lines = LINES.map(([a, b]) => {
		const [x1, y1] = STARS[a];
		const [x2, y2] = STARS[b];
		return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
	}).join("");

	const dust = DUST.map(
		([x, y, r, o]) =>
			`<circle cx="${x}" cy="${y}" r="${r}" fill-opacity="${o}"/>`,
	).join("");

	// Every third star twinkles, each on its own delay so they never pulse
	// together.
	const stars = STARS.map(([x, y, r], i) => {
		const tw =
			i % 3 === 0
				? ` class="tw" style="animation-delay:${(i * 0.7).toFixed(1)}s"`
				: "";
		return `<circle cx="${x}" cy="${y}" r="${r}"${tw}/>`;
	}).join("");

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 340" width="1200" height="340" role="img" aria-labelledby="t">
<title id="t">Divyansh Joshi, applied AI engineer. I build AI systems that keep working, and I can show you how I know they work.</title>
<style>
@font-face{font-family:'Instrument Serif';src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400;font-style:normal}
.serif{font-family:${SERIF}}
.sans{font-family:${SANS}}
.mono{font-family:${MONO}}
.tw{animation:tw 4.8s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:1}50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.tw{animation:none}}
</style>
<rect x="0.5" y="0.5" width="1199" height="339" rx="18" fill="${t.paper}" stroke="${t.rule}"/>
<g fill="${t.star}">${dust}</g>
<g stroke="${t.star}" stroke-opacity="0.45" stroke-width="1.2">${lines}</g>
<g fill="${t.star}">${stars}</g>
<rect x="64" y="58" width="6" height="22" rx="3" fill="${t.ink}"/>
<rect x="76" y="64" width="6" height="16" rx="3" fill="${t.accent}"/>
<text x="98" y="77" class="mono" font-size="16" letter-spacing="2.4" fill="${t.muted}">APPLIED AI ENGINEER · GURUGRAM, DELHI NCR</text>
<text x="60" y="176" class="serif" font-size="100" fill="${t.ink}">Divyansh Joshi</text>
<text x="64" y="228" class="serif" font-size="31" fill="${t.soft}">I build AI systems that keep working,</text>
<text x="64" y="264" class="serif" font-size="31" fill="${t.soft}">and I can show you how I know they work.</text>
<text x="64" y="306" class="sans" font-size="21" font-weight="600" fill="${t.accent}">divyanshjoshi.in  →</text>
</svg>
`;
}

for (const [name, theme] of Object.entries(THEMES)) {
	const out = join(root, `assets/header-${name}.svg`);
	writeFileSync(out, svg(theme));
	console.log(`wrote ${out}`);
}
