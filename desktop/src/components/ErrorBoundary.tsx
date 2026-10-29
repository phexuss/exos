import { CircleAlert } from 'lucide-react';
import { Component, type ReactNode } from 'react';
import { t } from '@/i18n';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Keeps a crashing screen from blanking the whole window; shows what broke instead. */
export class ScreenBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="page">
        <div className="empty">
          <CircleAlert size={40} />
          <strong>{t('errors.screen')}</strong>
          <code className="selectable">{error.message}</code>
          <button type="button" className="link-btn" onClick={() => this.setState({ error: null })}>
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }
}
