# WS OS

Portfólio profissional com experiência de sistema operacional, desenvolvido em React, JavaScript e Vite.

**Estado:** protótipo Desktop reorganizado. Os 18 aplicativos estão registrados, mas seu conteúdo funcional ainda não está implementado. Mobile e integrações protegidas permanecem futuros. Arquivos reservados não representam funcionalidades entregues.

## Executar

```bash
npm ci
npm run dev
npm run lint
npm run build
node --test tests/core/refactor.test.cjs
npm run preview
```

Quem já tem dependências instaladas pode executar diretamente os scripts. A reorganização não instalou nem atualizou pacotes.

## Documentação

- [Continuidade completa](docs/CONTINUIDADE.md): ponto de entrada para retomar em outra conversa.
- [Arquitetura](docs/architecture.md): responsabilidades, dependências, estado e estilos.
- [Estado da implementação](docs/implementation-status.md).
- [Contratos atuais e pendentes](docs/contracts.md).
- [Próximas etapas e critérios de aceite](docs/roadmap.md).
- [Inventário exato de arquivos](docs/file-inventory.md).
- [Planejamento canônico v0.16.0](docs/planning/WS-OS-V2-MESTRE-v0.16.0.md).

`core` contém regras e estado compartilhado; `shells` compõe Desktop/Mobile; `features` reúne capacidades do sistema; `apps` reserva os aplicativos; `services` contém acesso a provedores e armazenamento; `shared` contém recursos comuns comprovados; `styles` contém fundamentos, temas e a ordem dos estilos dos módulos.

Preferências continuam nas chaves existentes do navegador. Não há backend configurado nesta entrega. O domínio planejado é `warlley.dev`; publicação não foi executada.
