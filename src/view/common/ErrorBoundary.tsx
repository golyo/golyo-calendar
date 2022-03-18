import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert } from '@mui/material';
import { withTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

interface Props {
  children: ReactNode;
  t: TFunction;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('error', error);
    console.log('errorInfo', JSON.stringify(errorInfo));
    console.log('componentStack', errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return <Alert severity="error">{t('error.unknownError')}</Alert>;
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
