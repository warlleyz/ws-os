# WS OS

Portfólio profissional com experiência de sistema operacional, desenvolvido em React, JavaScript e Vite.

**Estado em 15/10/2026:** Desktop/Mobile funcionais, preferências e wallpapers locais, 17 componentes de aplicativos integrados. Administração continua reservada. Conteúdo pessoal, autenticação, IA remota, curtidas/rankings e configuração/aceite de serviços externos ainda têm pendências; não é uma versão final de produção.

## Executar

```bash
npm run dev
npm run lint
npm run build
npm test
npm run preview
```

Em uma instalação nova, usar `npm ci` antes dos scripts. Nenhuma dependência foi adicionada nesta entrega. Vite dev/preview executa o frontend; as Pages Functions exigem runtime/configuração próprios.

## Documentação atual

- [Entrega completa e continuidade](docs/ENTREGA-E-CONTINUIDADE-2026-10-15.md): estado real, commits, conteúdo, dados, validações, pendências e prompt para retomar.
- [Progresso e evidências por bloco](docs/PROGRESSO-CONCLUSAO.md).
- [Estado da implementação](docs/implementation-status.md).
- [Configurações e armazenamento de wallpapers](docs/settings.md).
- [Preparação de backend](docs/backend/CONFIGURACAO.md).
- [Arquitetura](docs/architecture.md) e [contratos](docs/contracts.md).
- [Próximas etapas](docs/roadmap.md) e [inventário de arquivos](docs/file-inventory.md).
- [Planejamento canônico v0.16.0](docs/planning/WS-OS-V2-MESTRE-v0.16.0.md).

Conteúdo público: `src/content/portfolioContent.js`. Nunca colocar credenciais privadas ou rascunhos secretos nesse arquivo ou em `public/`. Arquivos pessoais ficam exclusivamente no IndexedDB do navegador. A restauração de Configurações preserva documentos e imagem pessoal.

Não houve push ou deploy nesta entrega. Os serviços privados não estão configurados. O domínio planejado é `warlley.dev`.
