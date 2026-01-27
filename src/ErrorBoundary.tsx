import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", backgroundColor: "#111", color: "#E60012", height: "100vh", fontFamily: "monospace" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️ META-NAV ERROR ⚠️</h1>
          <h2 style={{ color: "white" }}>The Palace has collapsed.</h2>
          <pre style={{ backgroundColor: "#222", padding: "1rem", overflow: "auto", border: "1px solid #E60012" }}>
            {this.state.error?.toString()}
          </pre>
          <p style={{ marginTop: "1rem", color: "#666" }}>Check the F12 Console for stack trace.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
