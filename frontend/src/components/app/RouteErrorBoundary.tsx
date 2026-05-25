import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
          <Button onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
