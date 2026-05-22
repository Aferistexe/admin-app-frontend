import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <h2>Что-то пошло не так</h2>
          <p>Произошла ошибка в приложении</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="error-boundary-details">
              <summary>Детали ошибки (только для разработки)</summary>
              <pre className="error-boundary-pre">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button 
            onClick={this.handleReset}
            className="error-boundary-button"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;