
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/* === Configuração === */
/* ----- Repositório de origem ----- */
const ORIGIN =
    'https://raw.githubusercontent.com/warlleyz/portfolio-warlley/main/public/assets/cursors';

/* ----- Diretório de destino ----- */
const DESTINATION = path.resolve('public/assets/cursors');

/* === Cursores originais da V1 === */
const CURSORS = Object.freeze([
    'default',
    'pointer',
    'grab',
    'grabbing',
    'text',
    'resize-horizontal',
    'resize-vertical',
    'resize-diagonal-1',
    'resize-diagonal-2',
    'move',
    'not-allowed',
]);

/* === Paletas por tema === */
/* ----- Dark: preto com contorno branco ----- */
/* ----- Light: branco com contorno preto ----- */
const THEMES = Object.freeze({
    dark: {
        white: '#000000',
        black: '#FFFFFF',
    },

    light: {
        white: '#FFFFFF',
        black: '#000000',
    },
});

/* === Validação dos SVGs === */
/* ----- Conferir estrutura básica ----- */
function validateSvg(content, filename) {
    if (
        typeof content !== 'string' ||
        !/<svg(?:\s|>)/i.test(content) ||
        !/<\/svg\s*>/i.test(content)
    ) {
        throw new Error(`SVG inválido: ${filename}`);
    }
}

/* === Transformação de cores === */
/* ----- Substituição simultânea e segura ----- */
function replaceColors(content, replacements) {
    return content.replace(
        /#(?:FFFFFF|000000|172238|F4F8FF)\b/gi,
        (color) => replacements[color.toUpperCase()] ?? color,
    );
}

/* ----- Adaptar os cursores originais ----- */
function adaptOriginalCursor(content, theme) {
    const palette = THEMES[theme];

    return replaceColors(content, {
        '#FFFFFF': palette.white,
        '#000000': palette.black,
    });
}

/* ----- Adaptar ajuda e ocupado ----- */
function adaptAdditionalCursor(content, theme) {
    const palette = THEMES[theme];

    if (theme === 'dark') {
        return replaceColors(content, {
            '#FFFFFF': '#000000',
            '#000000': '#FFFFFF',
        });
    }

    return replaceColors(content, {
        '#172238': palette.white,
        '#F4F8FF': palette.black,
        '#FFFFFF': palette.white,
        '#000000': palette.black,
    });
}

/* === Importação dos cursores da V1 === */
/* ----- Obter SVG original ----- */
async function fetchOriginalCursor(filename) {
    const response = await fetch(`${ORIGIN}/${filename}`);

    if (!response.ok) {
        throw new Error(
            `Falha ao obter ${filename}: HTTP ${response.status}`,
        );
    }

    const content = await response.text();

    validateSvg(content, filename);

    return content;
}

/* ----- Gerar versões dos temas ----- */
async function importOriginalCursors() {
    let imported = 0;

    for (const cursor of CURSORS) {
        const filename = `cursor-${cursor}.svg`;
        const original = await fetchOriginalCursor(filename);

        for (const theme of Object.keys(THEMES)) {
            const content = adaptOriginalCursor(original, theme);

            const destination = path.join(
                DESTINATION,
                `${theme}-${filename}`,
            );

            await writeFile(destination, content, 'utf8');

            imported += 1;
        }
    }

    return imported;
}

/* === Cursores adicionais === */
/* ----- Sincronizar ajuda e ocupado entre temas ----- */
async function updateAdditionalCursors() {
  let updated = 0;

  for (const cursor of ['help', 'wait']) {
    const lightFilename = `light-cursor-${cursor}.svg`;
    const darkFilename = `dark-cursor-${cursor}.svg`;

    const lightPath = path.join(DESTINATION, lightFilename);
    const darkPath = path.join(DESTINATION, darkFilename);

    let lightSvg;

    try {
      lightSvg = await readFile(lightPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`Arquivo não encontrado: ${lightFilename}`);
        continue;
      }

      throw error;
    }

    validateSvg(lightSvg, lightFilename);

    /* ----- Normalizar Light: branco com contorno preto ----- */
    const normalizedLight = replaceColors(lightSvg, {
      '#172238': '#FFFFFF',
      '#F4F8FF': '#000000',
    });

    /* ----- Gerar Dark: preto com contorno branco ----- */
    const normalizedDark = replaceColors(normalizedLight, {
      '#FFFFFF': '#000000',
      '#000000': '#FFFFFF',
    });

    await writeFile(lightPath, normalizedLight, 'utf8');
    await writeFile(darkPath, normalizedDark, 'utf8');

    updated += 2;
  }

  return updated;
}

/* === Execução === */
/* ----- Importar e atualizar arquivos ----- */
async function main() {
    await mkdir(DESTINATION, { recursive: true });

    const imported = await importOriginalCursors();
    const updated = await updateAdditionalCursors();

    console.log('');
    console.log('Importação concluída.');
    console.log(`${imported} cursores originais gerados.`);
    console.log(`${updated} cursores adicionais atualizados.`);
    console.log(`Destino: ${DESTINATION}`);
}

await main();
