
const appDefinitions = [
    {
        id: 'about-me',
        name: 'Sobre Mim',
        category: 'desktop',
        allowMultipleInstances: false,
        pauseWhenMinimized: false,
        public: true,
    },
    {
        id: 'projects',
        name: 'Projetos',
        category: 'desktop',
        allowMultipleInstances: true,
        pauseWhenMinimized: true,
        public: true,
    },
];

export function getAppDefinition(appId) {
    return appDefinitions.find((app) => app.id === appId) ?? null;
}

export function getRegisteredApps() {
    return [...appDefinitions];
}
