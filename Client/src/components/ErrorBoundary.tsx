import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>Error Details:</Text>
          
          <ScrollView style={styles.scrollView}>
            {this.state.error && (
              <View style={styles.section}>
                <Text style={styles.label}>Error Message:</Text>
                <Text style={styles.text}>{this.state.error.message}</Text>
              </View>
            )}
            
            {this.state.error?.stack && (
              <View style={styles.section}>
                <Text style={styles.label}>Error Stack:</Text>
                <Text style={styles.stackText}>{this.state.error.stack}</Text>
              </View>
            )}
            
            {this.state.errorInfo?.componentStack && (
              <View style={styles.section}>
                <Text style={styles.label}>Component Stack:</Text>
                <Text style={styles.stackText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </View>
            )}
          </ScrollView>
          
          <Button mode="contained" onPress={this.handleReset} style={styles.button}>
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
  stackText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  button: {
    marginTop: 10,
  },
});
