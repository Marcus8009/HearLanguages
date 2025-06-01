// src/components/ErrorBoundary.js - Enhanced error handling
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Here you could send error to analytics service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In a real app, you'd send this to your error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location?.href || 'mobile-app',
    };
    
    console.log('📊 Error Report:', errorReport);
    
    // Example: Send to error reporting service
    // Analytics.recordError('app_error', errorReport);
  };

  handleRestart = () => {
    // Clear error state and attempt to restart
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    // For web, reload the page
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    } else {
      // For mobile, just restart the component
      this.handleRestart();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isProduction = process.env.NODE_ENV === 'production';

      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            {/* Error Icon */}
            <Text style={styles.errorIcon}>⚠️</Text>
            
            {/* Error Message */}
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              We're sorry, but something unexpected happened. Please try restarting the app.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={this.handleRestart}>
                <Text style={styles.primaryButtonText}>🔄 Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={this.handleReload}>
                <Text style={styles.secondaryButtonText}>♻️ Restart App</Text>
              </TouchableOpacity>
            </View>

            {/* Development Info */}
            {!isProduction && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                
                <View style={styles.debugSection}>
                  <Text style={styles.debugLabel}>Error:</Text>
                  <Text style={styles.debugText}>{error?.toString()}</Text>
                </View>

                {error?.stack && (
                  <View style={styles.debugSection}>
                    <Text style={styles.debugLabel}>Stack Trace:</Text>
                    <ScrollView style={styles.stackContainer} horizontal>
                      <Text style={styles.stackText}>{error.stack}</Text>
                    </ScrollView>
                  </View>
                )}

                {errorInfo?.componentStack && (
                  <View style={styles.debugSection}>
                    <Text style={styles.debugLabel}>Component Stack:</Text>
                    <ScrollView style={styles.stackContainer}>
                      <Text style={styles.stackText}>{errorInfo.componentStack}</Text>
                    </ScrollView>
                  </View>
                )}
                
                <View style={styles.debugSection}>
                  <Text style={styles.debugLabel}>Error ID:</Text>
                  <Text style={styles.debugText}>{this.state.errorId}</Text>
                </View>
              </View>
            )}

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpText}>
                If this problem persists, try clearing the app's data or reinstalling the app.
              </Text>
            </View>
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = (Component, fallbackComponent = null) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary fallback={fallbackComponent}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for error reporting from functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error('🚨 Manual error report:', error);
    
    // Create error report
    const errorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: errorInfo,
    };
    
    console.log('📊 Manual Error Report:', errorReport);
    
    // In a real app, send to error reporting service
    // Analytics.recordError('manual_error', errorReport);
  }, []);

  return { reportError: handleError };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'NotoSans-Bold',
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'NotoSans',
  },
  debugContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  debugTitle: {
    fontSize: 16,
    fontFamily: 'NotoSans-Bold',
    color: '#495057',
    marginBottom: 15,
  },
  debugSection: {
    marginBottom: 15,
  },
  debugLabel: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
    color: '#6c757d',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: '#495057',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  stackContainer: {
    maxHeight: 150,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  stackText: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: '#495057',
    padding: 10,
  },
  helpContainer: {
    width: '100%',
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  helpTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans-Bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 12,
    color: '#495057',
    lineHeight: 18,
  },
});

export default ErrorBoundary;