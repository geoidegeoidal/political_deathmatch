const fs = require('fs');

(async () => {
  const base = 'https://datasets-server.huggingface.co/rows?dataset=xaviviro%2Fcommon_voice_es_16_1_accent&config=default&split=train';
  const where = encodeURIComponent('"accent" LIKE \'Chileno%\' AND "gender"=\'male\'');
  const speakers = new Map();
  for (let off = 0; off < 600; off += 100) {
    let j = null;
    for (let attempt = 0; attempt < 6 && !j; attempt++) {
      try {
        const res = await fetch(base + '&where=' + where + '&offset=' + off + '&length=100');
        const text = await res.text();
        if (res.status === 429) { await new Promise(r => setTimeout(r, 20000 * (attempt + 1))); continue; }
        if (text.startsWith('{')) j = JSON.parse(text); else await new Promise(r => setTimeout(r, 8000));
      } catch { await new Promise(r => setTimeout(r, 8000)); }
    }
    if (!j) { console.log('stop en offset', off); break; }
    await new Promise(r => setTimeout(r, 2500));
    const rows = j.rows || [];
    if (!rows.length) break;
    for (const r of rows) {
      const row = r.row;
      const id = row.client_id;
      const votes = (row.up_votes || 0) - (row.down_votes || 0);
      const len = String(row.sentence || '').length;
      const s = speakers.get(id) || { id, clips: [] };
      s.clips.push({ votes, len, sentence: row.sentence, src: row.audio[0].src });
      speakers.set(id, s);
    }
  }
  const ranked = [...speakers.values()]
    .map(s => ({ ...s, totalVotes: s.clips.reduce((a, c) => a + c.votes, 0) }))
    .sort((a, b) => b.totalVotes - a.totalVotes);
  console.log('hablantes chilenos M:', ranked.length);
  for (const s of ranked.slice(0, 5)) {
    const good = s.clips.filter(c => c.len >= 70 && c.votes >= 2);
    console.log('---', s.id.slice(0, 14), '| votos:', s.totalVotes, '| clips:', s.clips.length, '| buenos:', good.length);
    for (const c of good.slice(0, 2)) console.log('    [' + c.len + 'ch v' + c.votes + ']', c.sentence.slice(0, 85));
  }
  fs.writeFileSync(process.env.TEMP + '/chileno_m_clips.json', JSON.stringify(ranked.slice(0, 2), null, 1));
})();
