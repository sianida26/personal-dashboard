# Error Handling

## Overview

The frontend implements comprehensive error handling strategies to provide graceful degradation, user-friendly error messages, and robust recovery mechanisms. Error handling is implemented at multiple levels: global, route, component, and API levels.

## Error Types and Classification

### Error Categories

#### 1. API Errors
- **Network errors** - Connection failures, timeouts
- **HTTP errors** - 400, 401, 403, 404, 500, etc.
- **Validation errors** - Form validation failures
- **Authentication errors** - Token expired, insufficient permissions

#### 2. Runtime Errors
- **JavaScript errors** - Uncaught exceptions, type errors
- **Component errors** - React component lifecycle errors
- **State errors** - Invalid state transitions

#### 3. User Experience Errors
- **Navigation errors** - Route not found, access denied
- **Loading errors** - Failed to load data or resources
- **Form errors** - Submission failures, validation errors

## Global Error Handling

### Error Boundary Implementation
```tsx
// src/components/ErrorBoundary.tsx
import React from 'react';
import { Alert, Button, Container, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error tracking service
    if (import.meta.env.PROD) {
      // Sentry, LogRocket, etc.
      // captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" mt="xl">
          <Stack align="center" gap="md">
            <IconAlertCircle size={48} color="red" />
            <Text size="xl" fw={600}>
              Something went wrong
            </Text>
            <Text c="dimmed" ta="center">
              An unexpected error occurred. Please try refreshing the page.
            </Text>
            
            <Button
              onClick={() => {
                this.setState({
                  hasError: false,
                  error: null,
                  errorInfo: null,
                });
              }}
            >
              Try Again
            </Button>
            
            <Button
              variant="light"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            
            {import.meta.env.DEV && this.state.error && (
              <Alert color="red" title="Error Details" mt="md">
                <Text size="sm" ff="monospace">
                  {this.state.error.message}
                </Text>
                {this.state.errorInfo && (
                  <Text size="xs" ff="monospace" mt="xs">
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </Alert>
            )}
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
```

### Global Error Handler
```typescript
// src/utils/errorHandler.ts
import { showNotification } from '@/utils/notifications';

export interface AppError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}

export class AppErrorHandler {
  static handle(error: any): void {
    console.error('Global error handler:', error);
    
    if (error instanceof AppError) {
      this.handleAppError(error);
    } else if (error.response) {
      this.handleApiError(error);
    } else if (error instanceof Error) {
      this.handleGenericError(error);
    } else {
      this.handleUnknownError(error);
    }
  }

  private static handleAppError(error: AppError): void {
    showNotification({
      message: error.message,
      color: 'red',
      title: 'Application Error',
    });
  }

  private static handleApiError(error: any): void {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    switch (status) {
      case 400:
        showNotification({
          message: 'Bad request. Please check your input.',
          color: 'red',
        });
        break;
      case 401:
        showNotification({
          message: 'Session expired. Please log in again.',
          color: 'red',
        });
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        showNotification({
          message: 'You do not have permission to perform this action.',
          color: 'red',
        });
        break;
      case 404:
        showNotification({
          message: 'The requested resource was not found.',
          color: 'red',
        });
        break;
      case 500:
        showNotification({
          message: 'Server error. Please try again later.',
          color: 'red',
        });
        break;
      default:
        showNotification({
          message: message || 'An error occurred.',
          color: 'red',
        });
    }
  }

  private static handleGenericError(error: Error): void {
    showNotification({
      message: error.message || 'An unexpected error occurred.',
      color: 'red',
    });
  }

  private static handleUnknownError(error: any): void {
    showNotification({
      message: 'An unknown error occurred.',
      color: 'red',
    });
  }
}

// Global error listener
window.addEventListener('error', (event) => {
  AppErrorHandler.handle(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  AppErrorHandler.handle(event.reason);
});
```

## API Error Handling

### Query Error Handling
```typescript
// src/hooks/useErrorHandler.ts
import { useQueryClient } from '@tanstack/react-query';
import { AppErrorHandler } from '@/utils/errorHandler';

export const useErrorHandler = () => {
  const queryClient = useQueryClient();

  const handleQueryError = (error: any) => {
    if (error.status === 401) {
      // Clear auth data and redirect
      queryClient.clear();
      window.location.href = '/login';
    } else {
      AppErrorHandler.handle(error);
    }
  };

  const handleMutationError = (error: any) => {
    AppErrorHandler.handle(error);
  };

  return {
    handleQueryError,
    handleMutationError,
  };
};
```

### Query Client Configuration
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { AppErrorHandler } from '@/utils/errorHandler';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        AppErrorHandler.handle(error);
      },
    },
    mutations: {
      retry: false,
      onError: (error) => {
        AppErrorHandler.handle(error);
      },
    },
  },
});
```

### API Client Error Handling
```typescript
// src/lib/honoClient.ts
import { hc } from 'hono/client';
import type { AppType } from '@backend/src/index';
import { AppErrorHandler } from '@/utils/errorHandler';

const handleApiError = (error: any) => {
  // Transform Hono client errors
  if (error.response) {
    const transformedError = {
      status: error.response.status,
      message: error.response.statusText,
      data: error.response.data,
    };
    AppErrorHandler.handle(transformedError);
  } else {
    AppErrorHandler.handle(error);
  }
};

export const client = hc<AppType>(import.meta.env.VITE_BACKEND_URL, {
  headers: async () => {
    const authData = await authDB.auth.get("auth");
    return {
      Authorization: `Bearer ${authData?.accessToken ?? ""}`,
    };
  },
  hooks: {
    onRequestError: handleApiError,
    onResponseError: handleApiError,
  },
});
```

## Component-Level Error Handling

### Error Fallback Components
```tsx
// src/components/ErrorFallback.tsx
import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  title?: string;
  message?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  message = "An error occurred while loading this component.",
}) => {
  return (
    <Alert
      color="red"
      title={title}
      icon={<IconAlertCircle size={16} />}
    >
      <Stack gap="sm">
        <Text size="sm">{message}</Text>
        
        <Button
          size="sm"
          leftSection={<IconRefresh size={14} />}
          onClick={resetErrorBoundary}
        >
          Try Again
        </Button>
        
        {import.meta.env.DEV && (
          <Text size="xs" ff="monospace" c="dimmed">
            {error.message}
          </Text>
        )}
      </Stack>
    </Alert>
  );
};
```

### Loading and Error States
```tsx
// src/components/DataDisplay.tsx
import { useQuery } from '@tanstack/react-query';
import { LoadingOverlay, Alert, Stack } from '@mantine/core';
import { ErrorFallback } from './ErrorFallback';

interface DataDisplayProps {
  queryKey: string[];
  queryFn: () => Promise<any>;
  children: (data: any) => React.ReactNode;
  fallback?: React.ReactNode;
}

export const DataDisplay: React.FC<DataDisplayProps> = ({
  queryKey,
  queryFn,
  children,
  fallback,
}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn,
  });

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={() => refetch()}
        title="Failed to load data"
        message="Unable to fetch the requested data. Please try again."
      />
    );
  }

  if (!data) {
    return fallback || (
      <Alert color="blue" title="No data available">
        No data to display at this time.
      </Alert>
    );
  }

  return <>{children(data)}</>;
};
```

## Form Error Handling

### Form Validation Errors
```tsx
// src/components/forms/FormErrorHandler.tsx
import { useForm } from '@mantine/form';
import { Alert, List, Text } from '@mantine/core';

interface FormErrorHandlerProps {
  form: ReturnType<typeof useForm>;
  errors?: Record<string, string[]>;
}

export const FormErrorHandler: React.FC<FormErrorHandlerProps> = ({
  form,
  errors,
}) => {
  const formErrors = form.errors;
  const hasErrors = Object.keys(formErrors).length > 0;

  if (!hasErrors && !errors) return null;

  return (
    <Alert color="red" title="Please fix the following errors:">
      <List size="sm">
        {Object.entries(formErrors).map(([field, error]) => (
          <List.Item key={field}>
            <Text span fw={500}>{field}:</Text> {error}
          </List.Item>
        ))}
        
        {errors && Object.entries(errors).map(([field, fieldErrors]) => (
          fieldErrors.map((error, index) => (
            <List.Item key={`${field}-${index}`}>
              <Text span fw={500}>{field}:</Text> {error}
            </List.Item>
          ))
        ))}
      </List>
    </Alert>
  );
};
```

### Mutation Error Handling
```tsx
// src/hooks/useMutationWithErrorHandling.ts
import { useMutation } from '@tanstack/react-query';
import { showNotification } from '@/utils/notifications';

export const useMutationWithErrorHandling = <T, R>(
  mutationFn: (variables: T) => Promise<R>,
  options?: {
    onSuccess?: (data: R) => void;
    onError?: (error: any) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) => {
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (options?.successMessage) {
        showNotification({
          message: options.successMessage,
          color: 'green',
        });
      }
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      // Handle validation errors
      if (error.status === 400 && error.data?.errors) {
        const validationErrors = error.data.errors;
        // Form will handle these errors
        return;
      }
      
      const errorMessage = options?.errorMessage || 
        error.message || 
        'An error occurred';
      
      showNotification({
        message: errorMessage,
        color: 'red',
      });
      
      options?.onError?.(error);
    },
  });
};
```

## Route-Level Error Handling

### Route Error Components
```tsx
// src/routes/__root.tsx
import { createRootRoute } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorFallback } from '@/components/ErrorFallback';

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ({ error }) => (
    <ErrorFallback
      error={error}
      resetErrorBoundary={() => window.location.reload()}
      title="Application Error"
      message="An error occurred while loading the application."
    />
  ),
});
```

### 404 Error Page
```tsx
// src/routes/404.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Container, Stack, Title, Text, Button } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';

const NotFoundPage = () => {
  return (
    <Container size="sm" mt="xl">
      <Stack align="center" gap="md">
        <Title order={1} size="4rem" c="dimmed">
          404
        </Title>
        <Title order={2}>Page Not Found</Title>
        <Text c="dimmed" ta="center">
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button
          leftSection={<IconHome size={16} />}
          component="a"
          href="/"
        >
          Go Home
        </Button>
      </Stack>
    </Container>
  );
};

export const Route = createFileRoute('/404')({
  component: NotFoundPage,
});
```

### 403 Forbidden Page
```tsx
// src/routes/403.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Container, Stack, Title, Text, Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

const ForbiddenPage = () => {
  return (
    <Container size="sm" mt="xl">
      <Stack align="center" gap="md">
        <IconLock size={64} color="orange" />
        <Title order={2}>Access Denied</Title>
        <Text c="dimmed" ta="center">
          You don't have permission to access this page.
        </Text>
        <Button
          component="a"
          href="/dashboard"
        >
          Go to Dashboard
        </Button>
      </Stack>
    </Container>
  );
};

export const Route = createFileRoute('/403')({
  component: ForbiddenPage,
});
```

## Error Recovery Strategies

### Retry Mechanisms
```tsx
// src/hooks/useRetryableQuery.ts
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export const useRetryableQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
  }
) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = options?.maxRetries || 3;

  const query = useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      if (failureCount >= maxRetries) return false;
      
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      
      return true;
    },
    retryDelay: options?.retryDelay || 1000,
  });

  const manualRetry = () => {
    setRetryCount(prev => prev + 1);
    query.refetch();
  };

  return {
    ...query,
    retryCount,
    manualRetry,
    canRetry: retryCount < maxRetries,
  };
};
```

### Fallback Data
```tsx
// src/hooks/useQueryWithFallback.ts
import { useQuery } from '@tanstack/react-query';

export const useQueryWithFallback = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  fallbackData: T
) => {
  return useQuery({
    queryKey,
    queryFn,
    select: (data) => data || fallbackData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## Error Monitoring and Reporting

### Error Tracking Integration
```typescript
// src/utils/errorTracking.ts
interface ErrorTrackingService {
  captureException(error: Error, context?: any): void;
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void;
}

class ErrorTracker implements ErrorTrackingService {
  private isEnabled = import.meta.env.PROD;

  captureException(error: Error, context?: any): void {
    if (!this.isEnabled) return;

    // Send to error tracking service
    console.error('Error captured:', error, context);
    
    // Example: Sentry integration
    // Sentry.captureException(error, { extra: context });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isEnabled) return;

    console.log(`[${level.toUpperCase()}] ${message}`);
    
    // Example: Sentry integration
    // Sentry.captureMessage(message, level);
  }
}

export const errorTracker = new ErrorTracker();
```

### Performance Monitoring
```typescript
// src/utils/performanceMonitoring.ts
export const performanceMonitor = {
  measureFunction: <T extends (...args: any[]) => any>(
    fn: T,
    name: string
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      console.log(`${name} took ${end - start} milliseconds`);
      
      return result;
    }) as T;
  },

  measureAsyncFunction: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    name: string
  ): T => {
    return (async (...args: Parameters<T>) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      console.log(`${name} took ${end - start} milliseconds`);
      
      return result;
    }) as T;
  },
};
```

## Testing Error Handling

### Error Boundary Testing
```tsx
// src/components/__tests__/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error fallback when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

### API Error Testing
```tsx
// src/hooks/__tests__/useErrorHandler.test.tsx
import { renderHook } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';

describe('useErrorHandler', () => {
  it('handles 401 errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const error = { status: 401, message: 'Unauthorized' };
    result.current.handleQueryError(error);
    
    // Test that auth is cleared and redirect happens
    expect(window.location.href).toBe('/login');
  });
});
```

## Best Practices

### Error Handling Guidelines
1. **Fail gracefully** - Never crash the entire application
2. **Provide clear messages** - User-friendly error descriptions
3. **Enable recovery** - Always provide a way to retry or recover
4. **Log comprehensively** - Capture enough context for debugging
5. **Test error scenarios** - Include error cases in testing

### Performance Considerations
- Avoid blocking UI with error handling
- Use proper loading states
- Implement circuit breakers for failing services
- Cache error responses where appropriate

### User Experience
- Show contextual error messages
- Provide helpful suggestions
- Maintain application state when possible
- Offer alternative actions

## Related Documentation

- [Data Management](./data-management.md) - Query and mutation error handling
- [Form Handling](./form-handling.md) - Form validation and errors
- [Authentication](./authentication.md) - Auth-related errors
- [Testing](./testing.md) - Testing error scenarios
