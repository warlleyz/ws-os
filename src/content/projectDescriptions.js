/* === DESCRIÇÕES COMPLEMENTARES === */
/* ----- Sínteses dos READMEs públicos conferidos em 02/11/2026 ----- */
const descriptions = {
  'warlleyz/ws-os': {
    'pt-BR':
      'Portfólio profissional em React com ambientes Desktop e Mobile, aplicativos, janelas e integrações de backend.',
    en: 'React professional portfolio with Desktop and Mobile environments, apps, windows, and backend integrations.',
  },
  'warlleyz/pokedex': {
    'pt-BR':
      'Aplicação React e Vite para consultar Pokémon e treinadores, com pesquisa e temas claro e escuro.',
    en: 'React and Vite application for browsing Pokémon and trainers, with search and light and dark themes.',
  },
  'warlleyz/sistema-hospitalar': {
    'pt-BR':
      'Projeto acadêmico de sistema hospitalar. A primeira sprint contém telas estáticas e modelagem; cadastro e backend ainda não estão implementados.',
    en: 'Academic hospital system project. The first sprint contains static screens and modeling; registration and backend are not implemented yet.',
  },
  'warlleyz/portfolio-warlley': {
    'pt-BR':
      'Portfólio acadêmico com interface de desktop, aplicativos e janelas para apresentar formação, projetos e contato.',
    en: 'Academic portfolio with a desktop interface, apps, and windows presenting education, projects, and contact information.',
  },
  'warlleyz/warlleyz': {
    'pt-BR':
      'README do perfil GitHub de Warlley Silva, com apresentação acadêmica, interesses e tecnologias em estudo.',
    en: 'Warlley Silva’s GitHub profile README, with academic background, interests, and technologies being studied.',
  },
};
export function projectDescription(repository, current) {
  if ((typeof current === 'string' && current.trim()) || (current && typeof current === 'object'))
    return current;
  try {
    const url = new URL(repository);
    if (url.hostname !== 'github.com' || url.protocol !== 'https:') return current ?? '';
    return (
      descriptions[
        new URL(repository).pathname.replace(/^\//, '').replace(/\/$/, '').toLowerCase()
      ] ??
      current ??
      ''
    );
  } catch {
    return current ?? '';
  }
}
