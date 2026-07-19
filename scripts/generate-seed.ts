/**
 * Génère supabase/seed.sql à partir de la source unique lib/activities.ts.
 * Lancer avec :  npx tsx scripts/generate-seed.ts
 *
 * La build de démo n'a pas besoin de ce fichier — il sert uniquement à
 * peupler un vrai projet Supabase avec le même catalogue d'activités.
 */
import { writeFileSync } from "node:fs";
import { ACTIVITIES } from "../lib/activities";

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

const rows = ACTIVITIES.map((a) => {
  const options = a.options ? `'${esc(JSON.stringify(a.options))}'::jsonb` : "null";
  const tags = `'${esc(JSON.stringify(a.tags))}'::jsonb`;
  const dur = a.durationSeconds ?? "null";
  return `('${a.type}', '${esc(a.title)}', '${esc(a.prompt)}', '${a.category}', ${a.depthLevel}, ${dur}, ${options}, ${tags}, ${a.active})`;
});

const sql = `-- Généré automatiquement depuis lib/activities.ts — ne pas éditer à la main.
-- ${ACTIVITIES.length} activités.
insert into activities (type, title, prompt, category, depth_level, duration_seconds, options, tags, active)
values
${rows.join(",\n")};
`;

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
// eslint-disable-next-line no-console
console.log(`Écrit supabase/seed.sql (${ACTIVITIES.length} activités).`);
