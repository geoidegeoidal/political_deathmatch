const fs = require('fs');

const WANT = [
  { group: 'Chileno', gender: 'male' },
  { group: 'Chileno', gender: 'female' },
  { group: 'Rioplatense', gender: 'male' },
  { group: 'Rioplatense', gender: 'female' },
  { group: 'México', gender: 'male' },
  { group: 'España', gender: 'female' },
];

function groupOf(accent) {
  if (!accent) return null;
  if (accent.startsWith('Chileno')) return 'Chileno';
  if (accent.startsWith('Rioplatense')) return 'Rioplatense';
  if (accent.startsWith('México')) return 'México';
  if (accent.startsWith('España')) return 'España';
  return null;
}

(async () => {
  const base = 'https://datasets-server.huggingface.co/rows?dataset=xaviviro%2Fcommon_voice_es_16_1_accent&config=default&split=train';
  const found = new Map(); // key group|gender -> best rows by votes
  let scanned = 0;

  for (let off = 0; off < 12000; off += 100) {
    let j = null;
    for (let attempt = 0; attempt < 4 && !j; attempt++) {
      try {
        const res = await fetch(base + '&offset=' + off + '&length=100', { headers: { 'User-Agent': 'political-deathmatch/0.1' } });
        const text = await res.text();
        if (text.startsWith('{')) j = JSON.parse(text);
        else await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      } catch { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); }
    }
    if (!j) throw new Error('datasets-server no respondió en offset ' + off);
    await new Promise(r => setTimeout(r, 250));
    for (const r of (j.rows || [])) {
      scanned++;
      const row = r.row;
      const g = groupOf(String(row.accent || ''));
      if (!g) continue;
      const key = g + '|' + String(row.gender || '');
      if (!WANT.some(w => w.group + '|' + w.gender === key)) continue;
      const votes = (row.up_votes || 0) - (row.down_votes || 0);
      const best = found.get(key);
      if (!best || votes > best.votes) {
        found.set(key, { ...row, votes, group: g });
      }
    }
  }

  console.log('filas escaneadas:', scanned);
  for (const w of WANT) {
    const row = found.get(w.group + '|' + w.gender);
    if (!row) { console.log('SIN CANDIDATO:', w.group, w.gender); continue; }
    console.log('---', w.group, w.gender, '| votos:', row.votes, '| id:', row.client_id.slice(0, 12));
    console.log('    sent:', row.sentence.slice(0, 90));
    console.log('    path:', row.path);
    console.log('    src:', (row.audio && row.audio[0] && row.audio[0].src || '').slice(0, 120));
  }
  fs.writeFileSync(process.env.TEMP + '/cv_candidates.json', JSON.stringify([...found.entries()], null, 1));
})();
