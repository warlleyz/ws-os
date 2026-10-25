/* === Resumo da documentação GitHub === */
/* ----- Seleção de conteúdo relevante, sem criar informações ----- */
const HEADINGS = [
  { type: 'about', pattern: /^(sobre(?: o projeto)?|descri[cç][aã]o|apresenta[cç][aã]o|overview|about(?: the project)?|introduction|introdu[cç][aã]o)$/i },
  { type: 'features', pattern: /^(funcionalidades|principais recursos|recursos|features|key features|what it does|o que faz)$/i },
  { type: 'stack', pattern: /^(tecnologias(?: utilizadas)?|tech stack|technologies|stack|built with)$/i },
];

const IGNORED = /^(instala[cç][aã]o|installation|getting started|quick ?start|como usar|uso|usage|setup|configura[cç][aã]o|configuration|deploy(?:ment)?|vercel|docker|licen[cç]a|license|contribui[cç][aã]o|contributing|estrutura|structure|requisitos|requirements|executar|running|run locally|autor(?:es)?|authors?|links?|contato|contact|scripts?|comandos?|commands?|screenshots?|capturas?|badges?)$/i;

/* ----- Limpeza de texto sem interpretar HTML não confiável ----- */
function cleanText(value) {
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~]/g, '')
    .replace(/&(?:nbsp|amp|lt|gt|quot);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ----- Manter frases completas, descartando trechos muito extensos ----- */
function completeSentences(value, limit = 420) {
  if (value.length <= limit) return value;
  const candidate = value.slice(0, limit + 1);
  const boundary = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf('! '), candidate.lastIndexOf('? '));
  return boundary >= 75 ? candidate.slice(0, boundary + 1).trim() : '';
}

/* ----- Separação por títulos Markdown e seções nomeadas ----- */
function splitSections(markdown) {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '\n')
    .replace(/<(?:script|style)[^>]*>[\s\S]*?<\/(?:script|style)>/gi, '\n')
    .replace(/\r\n?/g, '\n');

  const lines = cleaned.split('\n');
  const sections = [{ heading: '', body: [] }];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const atx = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    const setext = i + 1 < lines.length && /^\s*(?:={3,}|-{3,})\s*$/.test(lines[i + 1]);
    if (atx || (setext && line.trim())) {
      const heading = cleanText(atx ? atx[1] : line);
      sections.push({ heading, body: [] });
      if (setext && !atx) i += 1;
      continue;
    }
    sections.at(-1).body.push(line);
  }
  return sections;
}

/* ----- Extrair parágrafos e listas sem misturar código e instruções ----- */
function sectionBlocks(section, type) {
  const source = section.body.join('\n')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '\n')
    .replace(/^\s*\|.*$/gm, '')
    .replace(/^\s*(?:[-*_]){3,}\s*$/gm, '');

  const blocks = source.split(/\n\s*\n/).flatMap((block) => {
    const lines = block.split('\n').filter((line) => !/^\s*(?:>|\[!\[|https?:\/\/)/i.test(line));
    if (type === 'features' || type === 'stack') {
      const entries = lines
        .filter((line) => /^\s*(?:[-*+]|\d+[.)])\s+/.test(line))
        .map((line) => cleanText(line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')))
        .filter((entry) => entry.length >= 3 && entry.length <= 150);
      if (entries.length) return [entries.slice(0, 5).join(' · ')];
    }
    return [cleanText(lines.join(' '))];
  });
  return blocks
    .filter((block) => block.length >= (type === 'stack' ? 8 : 35))
    .filter((block) => !/^(?:npm |yarn |pnpm |git clone|curl |docker |cd |vercel |pip |mvn )/i.test(block))
    .map((block) => completeSentences(block))
    .filter(Boolean);
}

/* === API pública de extração === */
/* ----- Priorizar apresentação, funcionalidades e tecnologias ----- */
export function summarizeReadme(markdown) {
  if (typeof markdown !== 'string' || !markdown.trim()) return [];

  const sections = splitSections(markdown);
  const selected = [];
  const used = new Set();

  for (const type of ['about', 'features', 'stack']) {
    const section = sections.find((item) =>
      HEADINGS.some((rule) => rule.type === type && rule.pattern.test(item.heading)));
    if (!section) continue;
    const excerpt = sectionBlocks(section, type)[0];
    if (!excerpt) continue;
    selected.push(excerpt);
    used.add(section);
  }

  /* ----- Fallback: introdução genuína, sem instruções de instalação ou deploy ----- */
  if (!selected.length) {
    for (const section of sections) {
      if (IGNORED.test(section.heading)) continue;
      const excerpt = sectionBlocks(section, 'about')[0];
      if (excerpt) {
        selected.push(excerpt);
        break;
      }
    }
  }

  return [...new Set(selected)].slice(0, 3);
}
