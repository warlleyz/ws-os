import { Component } from 'react';

import { translate as t } from '../i18n/i18n';

/* === TRATAMENTO DE ERROS DOS APLICATIVOS === */
export default class AppErrorBoundary extends Component {
  /* ----- ESTADO INICIAL ----- */
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  /* ----- CAPTURA DE ERROS ----- */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /* === RENDERIZAÇÃO === */
  render() {
    if (this.state.hasError) {
      return (
        <div className="desktop-window__content" role="alert">
          <h2>{t('Erro no aplicativo')}</h2>
          <p>{t('Não foi possível carregar ou executar este aplicativo.')}</p>

          <button
            type="button"
            onClick={() => {
              if (this.props.onRetry) {
                this.props.onRetry();
              } else {
                this.setState({ hasError: false });
              }
            }}
          >
            {t('Tentar novamente')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}