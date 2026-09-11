import { StrictMode, Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./app/App";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("RootErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#DC2626] text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-[#1F2937] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#4B5563] mb-6">
              {this.state.error?.message || "An unexpected error occurred while rendering the page."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-[#2855A6] text-white text-sm font-semibold rounded-lg hover:bg-[#1F4491] transition-colors"
              >
                Reload page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                className="px-4 py-2 border border-[#D1D5DB] text-[#374151] text-sm font-semibold rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
