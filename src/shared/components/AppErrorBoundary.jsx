import { translate as t } from '../i18n/i18n';
import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="desktop-window__content" role="alert">
          <h2>{t('Erro no aplicativo')}</h2>
          <p>{t('Não foi possível carregar ou executar este aplicativo.')}</p>

          <button
            type="button"
            onClick={() => {
              if (this.props.onRetry) this.props.onRetry();
              else this.setState({ hasError: false });
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
