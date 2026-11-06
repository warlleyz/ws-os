import { Fragment } from 'react';

/* === FORMATAÇÃO SEGURA DAS RESPOSTAS DO WALLY === */
const MESSAGE_PATTERN =
  /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*\n]+)\*\*|https?:\/\/[^\s<>]+/g;

/* ----- Separar pontuação final de URLs ----- */
function splitUrlPunctuation(value) {
  const url = value.replace(/[.,!?;:]+$/, '');

  return {
    url,
    suffix: value.slice(url.length),
  };
}

/* ----- Renderizar link externo ----- */
function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/* === RENDERIZAÇÃO DAS MENSAGENS === */
export default function WallyMessageText({ text }) {
  const content = String(text ?? '');
  const elements = [];
  let cursor = 0;

  for (const match of content.matchAll(MESSAGE_PATTERN)) {
    const index = match.index;

    /* ----- Texto anterior ao marcador ----- */
    if (index > cursor) {
      elements.push(<Fragment key={`text-${cursor}`}>{content.slice(cursor, index)}</Fragment>);
    }

    /* ----- Link Markdown com descrição ----- */
    if (match[1] && match[2]) {
      elements.push(
        <ExternalLink key={`link-${index}`} href={match[2]}>
          {match[1]}
        </ExternalLink>,
      );
    } else if (match[3]) {
      /* ----- Texto em negrito ----- */
      elements.push(<strong key={`bold-${index}`}>{match[3]}</strong>);
    } else {
      /* ----- URL escrita diretamente ----- */
      const { url, suffix } = splitUrlPunctuation(match[0]);

      elements.push(
        <Fragment key={`url-${index}`}>
          <ExternalLink href={url}>{url}</ExternalLink>
          {suffix}
        </Fragment>,
      );
    }

    cursor = index + match[0].length;
  }

  /* ----- Texto restante ----- */
  if (cursor < content.length) {
    elements.push(<Fragment key={`text-${cursor}`}>{content.slice(cursor)}</Fragment>);
  }

  return <>{elements}</>;
}
