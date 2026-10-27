import fs from "node:fs";

const input = fs.readFileSync(0, "utf8");
const payload = JSON.parse(input);
const rows = payload[0]?.results ?? [];

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const abbreviations = {
  "Australian Grand Prix": "AUS", "Chinese Grand Prix": "CHN",
  "Japanese Grand Prix": "JPN", "Miami Grand Prix": "MIA",
  "Canadian Grand Prix": "CAN", "Monaco Grand Prix": "MON",
  "Spanish Grand Prix": "ESP", "Austrian Grand Prix": "AUT",
  "British Grand Prix": "GBR", "Belgian Grand Prix": "BEL",
  "Hungarian Grand Prix": "HUN", "Dutch Grand Prix": "NED",
  "Italian Grand Prix": "ITA", "Madrid Grand Prix": "MAD",
  "Azerbaijan Grand Prix": "AZE", "Singapore Grand Prix": "SGP",
  "United States Grand Prix": "USA",
};

const races = [...new Map(rows.map((row) => [row.round, {
  round: row.round,
  name: row.race_name,
  short: abbreviations[row.race_name] ?? `R${row.round}`,
}])).values()].sort((a, b) => a.round - b.round);

const names = [...new Set(rows.map((row) => row.nickname))];
const pointsByPlayer = new Map(names.map((name) => [name, new Map()]));
for (const row of rows) pointsByPlayer.get(row.nickname).set(row.round, row.race_points ?? 0);

const players = names.map((name) => {
  let total = 0;
  const cumulative = [0];
  for (const race of races) {
    total += pointsByPlayer.get(name).get(race.round) ?? 0;
    cumulative.push(total);
  }
  return { name, cumulative, total };
}).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

const width = 1800;
const height = 1080;
const margin = { top: 130, right: 430, bottom: 130, left: 110 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;
const maxScore = Math.ceil(Math.max(...players.map((p) => p.total), 1) / 50) * 50;
const x = (index) => margin.left + (index / races.length) * plotWidth;
const y = (score) => margin.top + plotHeight - (score / maxScore) * plotHeight;
const colors = [
  "#ff4d5a", "#45a7ff", "#ffd166", "#45d483", "#c084fc", "#ff8c42",
  "#32d5d2", "#f472b6", "#a3e635", "#93a4bf", "#f8fafc", "#fb7185", "#818cf8",
];

const parts = [];
parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
parts.push(`<rect width="100%" height="100%" fill="#090d16"/>`);
parts.push(`<text x="${margin.left}" y="62" fill="#f8fafc" font-family="Arial, sans-serif" font-size="40" font-weight="700">F1 Fantasy — Cumulative Player Scores</text>`);
parts.push(`<text x="${margin.left}" y="98" fill="#93a4bf" font-family="Arial, sans-serif" font-size="20">2026 season through the United States Grand Prix</text>`);

for (let score = 0; score <= maxScore; score += 50) {
  const gy = y(score);
  parts.push(`<line x1="${margin.left}" y1="${gy}" x2="${margin.left + plotWidth}" y2="${gy}" stroke="#263247" stroke-width="1"/>`);
  parts.push(`<text x="${margin.left - 18}" y="${gy + 7}" text-anchor="end" fill="#93a4bf" font-family="Arial, sans-serif" font-size="18">${score}</text>`);
}

for (let i = 0; i <= races.length; i++) {
  const gx = x(i);
  parts.push(`<line x1="${gx}" y1="${margin.top}" x2="${gx}" y2="${margin.top + plotHeight}" stroke="#182236" stroke-width="1"/>`);
  const label = i === 0 ? "START" : races[i - 1].short;
  parts.push(`<text x="${gx}" y="${margin.top + plotHeight + 38}" text-anchor="middle" fill="#aebbd0" font-family="Arial, sans-serif" font-size="17" font-weight="600">${label}</text>`);
}

players.forEach((player, index) => {
  const color = colors[index % colors.length];
  const path = player.cumulative.map((score, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(score).toFixed(1)}`).join(" ");
  const inactive = player.total === 0;
  parts.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width="${inactive ? 2 : 4}" stroke-linejoin="round" stroke-linecap="round" opacity="${inactive ? 0.45 : 0.9}"${inactive ? ' stroke-dasharray="7 7"' : ""}/>`);
  player.cumulative.forEach((score, i) => {
    if (i > 0 && score !== player.cumulative[i - 1]) {
      parts.push(`<circle cx="${x(i)}" cy="${y(score)}" r="5" fill="${color}" stroke="#090d16" stroke-width="2"/>`);
    }
  });
});

parts.push(`<text x="${margin.left + plotWidth + 55}" y="${margin.top - 28}" fill="#f8fafc" font-family="Arial, sans-serif" font-size="24" font-weight="700">Final standings</text>`);
players.forEach((player, index) => {
  const color = colors[index % colors.length];
  const ly = margin.top + 22 + index * 57;
  const displayName = player.name.length > 26 ? `${player.name.slice(0, 25)}…` : player.name;
  parts.push(`<line x1="${margin.left + plotWidth + 55}" y1="${ly}" x2="${margin.left + plotWidth + 88}" y2="${ly}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`);
  parts.push(`<text x="${margin.left + plotWidth + 103}" y="${ly + 7}" fill="#dce5f4" font-family="Arial, sans-serif" font-size="18"><title>${escapeXml(player.name)}</title>${index + 1}. ${escapeXml(displayName)}</text>`);
  parts.push(`<text x="${width - 55}" y="${ly + 7}" text-anchor="end" fill="${color}" font-family="Arial, sans-serif" font-size="20" font-weight="700">${player.total}</text>`);
});

parts.push(`<text x="${margin.left}" y="${height - 35}" fill="#6f7f98" font-family="Arial, sans-serif" font-size="16">Missed races add 0 points. Source: live F1 Fantasy roster scores.</text>`);
parts.push(`</svg>`);

fs.writeFileSync(new URL("../player-scores-over-time.svg", import.meta.url), parts.join("\n"));
