
import { useMemo, useState } from 'react';
import {
    ArrowUpRight,
    GitFork,
    GitBranch,
    Layers3,
    Star,
} from 'lucide-react';

import './RepositoryOrbit.css';

/* === Configuração das órbitas === */
const MAX_VISIBLE = 15;
const ORBIT_CAPACITIES = [4, 5, 6];

const ORBITS = [
    { rx: 105, ry: 48 },
    { rx: 185, ry: 85 },
    { rx: 265, ry: 123 },
];

const COLORS = [
    '#65a9ff',
    '#a68aff',
    '#4bcbb5',
    '#f0ac69',
    '#dd81be',
    '#86c96d',
];

const COPY = {
    'pt-BR': {
        title: 'Universo de projetos',
        description: 'Explore os repositórios que compõem meu GitHub.',
        select: 'Selecione um repositório',
        selectHint: 'Selecione um ponto da órbita para ver os detalhes.',
        repositories: 'Repositórios',
        stars: 'Estrelas',
        forks: 'Forks',
        language: 'Linguagem',
        updated: 'Atualizado',
        noDescription: 'Sem descrição cadastrada.',
        unknown: 'Não informada',
        open: 'Abrir no GitHub',
        more: 'repositórios adicionais',
        empty: 'Nenhum repositório disponível.',
        navigation: 'Navegação entre repositórios',
        all: 'Todos os projetos',
    },
    en: {
        title: 'Project universe',
        description: 'Explore the repositories in my GitHub ecosystem.',
        select: 'Select a repository',
        selectHint: 'Select an orbital node to view its details.',
        repositories: 'Repositories',
        stars: 'Stars',
        forks: 'Forks',
        language: 'Language',
        updated: 'Updated',
        noDescription: 'No description provided.',
        unknown: 'Not specified',
        open: 'Open on GitHub',
        more: 'additional repositories',
        empty: 'No repositories available.',
        navigation: 'Repository navigation',
        all: 'All projects',
    },
};

/* === Organização determinística dos nós === */
function createNodes(repositories) {
    const visible = [...repositories]
        .sort((a, b) => {
            const stars = (b.stars ?? 0) - (a.stars ?? 0);
            if (stars) return stars;

            const recent =
                Date.parse(b.updatedAt ?? '') -
                Date.parse(a.updatedAt ?? '');

            return (Number.isFinite(recent) ? recent : 0) ||
                a.name.localeCompare(b.name);
        })
        .slice(0, MAX_VISIBLE);

    let position = 0;

    return ORBIT_CAPACITIES.flatMap((capacity, orbitIndex) => {
        const group = visible.slice(position, position + capacity);
        position += capacity;

        const { rx, ry } = ORBITS[orbitIndex];

        return group.map((repo, index) => {
            const angle =
                (index / capacity) * Math.PI * 2 -
                Math.PI / 2 +
                orbitIndex * 0.28;

            const x = 300 + Math.cos(angle) * rx;
            const y = 190 + Math.sin(angle) * ry;

            const size = Math.min(
                22,
                10 + Math.log2(1 + Math.max(0, repo.stars ?? 0)) * 3,
            );

            return {
                repo,
                x,
                y,
                size,
                orbitIndex,
            };
        });
    });
}

/* === Formatação === */
function formatDate(value, locale) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

/* === Universo interativo === */
export default function RepositoryOrbit({
    repositories = [],
    locale = 'pt-BR',
}) {
    const copy = COPY[locale] || COPY['pt-BR'];
    const [selectedId, setSelectedId] = useState(null);

    const nodes = useMemo(
        () => createNodes(repositories),
        [repositories],
    );

    const selected =
        nodes.find(({ repo }) => repo.id === selectedId)?.repo ?? null;

    const visible = nodes.length;
    const remaining = Math.max(0, repositories.length - visible);

    const languages = [...new Set(
        nodes.map(({ repo }) => repo.language).filter(Boolean),
    )];

    const languageColors = new Map(
        languages.map((name, index) => [
            name,
            COLORS[index % COLORS.length],
        ]),
    );

    return (
        <section className="ws-orbit">
            {/* === Cabeçalho === */}
            <header className="ws-orbit__header">
                <div>
                    <span className="ws-orbit__eyebrow">
                        <Layers3 size={13} />
                        REPOSITORY EXPLORER
                    </span>
                    <h3>{copy.title}</h3>
                    <p>{copy.description}</p>
                </div>

                <span className="ws-orbit__count">
                    <GitBranch size={14} />
                    {repositories.length} {copy.repositories.toLowerCase()}
                </span>
            </header>

            {nodes.length === 0 ? (
                <div className="ws-orbit__empty" role="status">
                    {copy.empty}
                </div>
            ) : (
                <div className="ws-orbit__layout">
                    {/* === Área orbital === */}
                    <div className="ws-orbit__stage">
                        <svg
                            className="ws-orbit__scene"
                            viewBox="0 0 600 380"
                            role="group"
                            aria-label={copy.navigation}
                        >
                            <defs>
                                <radialGradient id="ws-orbit-core">
                                    <stop
                                        offset="0%"
                                        stopColor="var(--accent-primary)"
                                        stopOpacity="0.25"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--accent-primary)"
                                        stopOpacity="0"
                                    />
                                </radialGradient>
                            </defs>

                            {/* ----- Área central ----- */}
                            <circle
                                cx="300"
                                cy="190"
                                r="95"
                                fill="url(#ws-orbit-core)"
                            />

                            {ORBITS.map((orbit, index) => (
                                <ellipse
                                    key={index}
                                    cx="300"
                                    cy="190"
                                    rx={orbit.rx}
                                    ry={orbit.ry}
                                    className="ws-orbit__ring"
                                />
                            ))}

                            <circle
                                cx="300"
                                cy="190"
                                r="25"
                                className="ws-orbit__core"
                            />
                            <circle
                                cx="300"
                                cy="190"
                                r="10"
                                className="ws-orbit__core-inner"
                            />

                            {/* ----- Nós interativos ----- */}
                            {nodes.map(({ repo, x, y, size }) => {
                                const active = selected?.id === repo.id;
                                const color =
                                    languageColors.get(repo.language) ||
                                    'var(--accent-primary)';

                                const label = [
                                    repo.name,
                                    repo.language || copy.unknown,
                                    `${repo.stars ?? 0} ${copy.stars}`,
                                ].join(', ');

                                return (
                                    <g
                                        key={repo.id}
                                        className={[
                                            'ws-orbit__node',
                                            active ? 'is-selected' : '',
                                        ].filter(Boolean).join(' ')}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={label}
                                        aria-pressed={active}
                                        onClick={() => setSelectedId(repo.id)}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === 'Enter' ||
                                                event.key === ' '
                                            ) {
                                                event.preventDefault();
                                                setSelectedId(repo.id);
                                            }
                                        }}
                                        style={{ '--orbit-color': color }}
                                    >
                                        <title>{label}</title>

                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={size + 8}
                                            className="ws-orbit__node-halo"
                                        />

                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={size}
                                            className="ws-orbit__node-body"
                                        />

                                        <circle
                                            cx={x - size * 0.25}
                                            cy={y - size * 0.25}
                                            r={Math.max(2, size * 0.25)}
                                            className="ws-orbit__node-shine"
                                        />
                                    </g>
                                );
                            })}
                        </svg>

                        <div className="ws-orbit__stage-footer">
                            <span>{copy.selectHint}</span>
                            <span>
                                {visible} / {repositories.length}
                            </span>
                        </div>
                    </div>

                    {/* === Painel contextual === */}
                    <aside className="ws-orbit__details">
                        {selected ? (
                            <>
                                <span className="ws-orbit__details-label">
                                    REPOSITORY DETAILS
                                </span>

                                <h4>{selected.name}</h4>
                                <p className="ws-orbit__description">
                                    {selected.description || copy.noDescription}
                                </p>

                                <div className="ws-orbit__details-grid">
                                    <div>
                                        <Star size={14} />
                                        <span>{copy.stars}</span>
                                        <strong>{selected.stars ?? '—'}</strong>
                                    </div>

                                    <div>
                                        <GitFork size={14} />
                                        <span>{copy.forks}</span>
                                        <strong>{selected.forks ?? '—'}</strong>
                                    </div>
                                </div>

                                <dl className="ws-orbit__properties">
                                    <div>
                                        <dt>{copy.language}</dt>
                                        <dd>{selected.language || copy.unknown}</dd>
                                    </div>

                                    <div>
                                        <dt>{copy.updated}</dt>
                                        <dd>{formatDate(selected.updatedAt, locale)}</dd>
                                    </div>
                                </dl>

                                {selected.repository && (
                                    <a
                                        className="ws-orbit__link"
                                        href={selected.repository}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {copy.open}
                                        <ArrowUpRight size={15} />
                                    </a>
                                )}
                            </>
                        ) : (
                            <div className="ws-orbit__placeholder">
                                <Layers3 size={34} strokeWidth={1.3} />
                                <strong>{copy.select}</strong>
                                <p>{copy.selectHint}</p>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {/* === Legenda === */}
            {nodes.length > 0 && (
                <footer className="ws-orbit__footer">
                    <div className="ws-orbit__legend">
                        {languages.map((name) => (
                            <span key={name}>
                                <i
                                    style={{
                                        background: languageColors.get(name),
                                    }}
                                />
                                {name}
                            </span>
                        ))}
                    </div>

                    {remaining > 0 && (
                        <span className="ws-orbit__remaining">
                            +{remaining} {copy.more}
                        </span>
                    )}
                </footer>
            )}
        </section>
    );
}
