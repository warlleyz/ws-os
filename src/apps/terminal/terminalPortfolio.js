
/* === Sistema virtual de leitura do portfólio === */

export function createPortfolioTree(portfolio, repositories, locale, contentText) {
    const tree = new Map();

    function directory(path) {
        if (!tree.has(path)) {
            tree.set(path, { directories: [], files: new Map() });
        }
        return tree.get(path);
    }

    function addDirectory(parent, name) {
        const path = `${parent}/${name}`;

        if (!directory(parent).directories.includes(name)) {
            directory(parent).directories.push(name);
        }

        directory(path);
        return path;
    }

    function addFile(parent, name, content) {
        directory(parent).files.set(name, String(content ?? ''));
    }

    const localized = (value) => contentText(value, locale);

    /* === Diretórios oficiais === */
    const root = '~/portfolio';
    const about = addDirectory(root, 'about');
    const projects = addDirectory(root, 'projects');
    const technologies = addDirectory(root, 'technologies');
    const contact = addDirectory(root, 'contact');
    const resume = addDirectory(root, 'resume');
    const certificates = addDirectory(root, 'certificates');

    /* === Apresentação === */
    addFile(
        root,
        'README.md',
        [
            'WS OS — Portfólio profissional',
            '',
            'Diretórios disponíveis:',
            '  about/          Perfil profissional',
            '  projects/       Repositórios públicos',
            '  technologies/   Conhecimentos técnicos',
            '  contact/        Canais profissionais',
            '  resume/         Currículo',
            '  certificates/   Certificados',
            '',
            'Comandos: ls, cd, pwd, cat',
            'Arquivos pessoais: cd ~/personal',
        ].join('\n'),
    );

    /* === Perfil === */
    addFile(
        about,
        'profile.txt',
        [
            portfolio.profile?.name ?? '',
            localized(portfolio.profile?.headline),
            '',
            localized(portfolio.profile?.summary),
        ].join('\n'),
    );

    /* === Tecnologias === */
    addFile(
        technologies,
        'stack.txt',
        (portfolio.resume?.sections ?? [])
            .filter((section) => section.id === 'technical-skills')
            .flatMap((section) =>
                section.items.flatMap((item) => [
                    localized(item.title),
                    localized(item.description),
                    '',
                ]),
            )
            .join('\n'),
    );

    /* === Contato === */
    addFile(
        contact,
        'contact.txt',
        (portfolio.contact?.links ?? [])
            .map((link) => `${localized(link.label)}: ${link.url}`)
            .join('\n'),
    );

    /* === Currículo === */
    addFile(
        resume,
        'README.md',
        [
            'Currículo profissional',
            '',
            'Utilize open resume para visualizar o documento.',
        ].join('\n'),
    );

    /* === Certificados === */
    addFile(
        certificates,
        'README.md',
        (portfolio.certificates ?? [])
            .map(
                (item) =>
                    `${localized(item.title)}\n${item.issuer ?? ''}\n${localized(item.description)}`,
            )
            .join('\n\n'),
    );

    /* === Projetos reais === */
    for (const project of repositories) {
        if (!project?.name || !project?.repository) continue;

        const name = project.name;

        /* ----- Evitar nomes que possam alterar a hierarquia ----- */
        if (
            !/^[a-z\d][a-z\d._-]*$/i.test(name) ||
            name === '.' ||
            name === '..'
        ) {
            continue;
        }

        const folder = addDirectory(projects, name);

        addFile(
            folder,
            'README.md',
            [
                `# ${project.name}`,
                '',
                project.description || 'Descrição não informada.',
                '',
                `Repositório: ${project.repository}`,
                `Linguagem: ${project.language ?? 'Não informada'}`,
                `Tecnologias: ${(project.technologies ?? []).join(', ') || 'Não informadas'}`,
                `Licença: ${project.license ?? 'Não informada'}`,
                `Atualização: ${project.updatedAt ?? 'Não informada'}`,
                '',
                'Os dados acima são metadados públicos do GitHub.',
                'Este README é gerado pelo WS OS; não é o README original do repositório.',
            ].join('\n'),
        );
    }

    return tree;
}

/* === Resolução de caminhos === */

export function normalizePortfolioPath(currentPath, target) {
    const value = String(target ?? '.').trim();

    let parts;

    if (value === '~') {
        parts = [];
    } else if (value.startsWith('~/')) {
        parts = [];
    } else if (value.startsWith('/')) {
        parts = [];
    } else {
        parts = currentPath.replace(/^~\/?/, '').split('/').filter(Boolean);
    }

    const source = value
        .replace(/^~\/?/, '')
        .split('/');

    for (const part of source) {
        if (!part || part === '.') continue;

        if (part === '..') {
            parts.pop();
            continue;
        }

        if (part.includes('\\') || part.includes('\0')) {
            throw new Error('Caminho inválido.');
        }

        parts.push(part);
    }

    return parts.length ? `~/${parts.join('/')}` : '~';
}

export function listPortfolioPath(tree, path) {
    if (path === '~') return ['portfolio/', 'personal/'];

    const directory = tree.get(path);

    if (!directory) {
        throw new Error(`Diretório não encontrado: ${path}`);
    }

    return [
        ...directory.directories.map((name) => `${name}/`),
        ...directory.files.keys(),
    ];
}

export function readPortfolioPath(tree, path) {
    const slash = path.lastIndexOf('/');
    const parent = path.slice(0, slash);
    const filename = path.slice(slash + 1);

    const content = tree.get(parent)?.files.get(filename);

    if (content === undefined) {
        throw new Error(`Arquivo não encontrado: ${filename}`);
    }

    return content;
}

export function isPortfolioDirectory(tree, path) {
    return path === '~' || tree.has(path);
}
