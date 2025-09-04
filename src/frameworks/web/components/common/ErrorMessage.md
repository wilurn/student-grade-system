# ErrorMessage Component

A reusable error display component that provides user-friendly error messages with different styling based on error types and optional retry functionality.

## Features

- **Multiple Error Types**: Network, validation, authentication, authorization, server, and generic errors
- **User-Friendly Messages**: Automatically converts domain errors to user-friendly messages
- **Retry Functionality**: Optional retry button for recoverable errors
- **Dismissible**: Optional dismiss button for non-critical errors
- **Accessibility**: Full ARIA support and keyboard navigation
- **Responsive Design**: Mobile-friendly layout
- **Domain Integration**: Built-in support for application's domain error types

## Basic Usage

```tsx
import { ErrorMessage } from '../common';

// Simple error message
<ErrorMessage message="Something went wrong. Please try again." />

// Network error with retry functionality
<ErrorMessage
  message="Failed to load data. Please check your connection."
  type="network"
  onRetry={() => refetchData()}
/>

// Dismissible validation error
<ErrorMessage
  message="Please enter a valid email address."
  type="validation"
  dismissible={true}
  onDismiss={() => clearError()}
/>
```

## Using with Domain Errors

The component provides a convenient wrapper for handling domain errors:

```tsx
import { ErrorMessageFromDomain } from '../common';
import { DomainException, ErrorCode } from '../../../../shared/types';

// Automatically maps domain errors to appropriate types and messages
const error = new DomainException({
  code: ErrorCode.NETWORK_ERROR,
  message: 'Network request failed',
});

<ErrorMessageFromDomain error={error} onRetry={() => retryOperation()} />;
```

## Error Types

| Type             | Description                          | Use Case                                    |
| ---------------- | ------------------------------------ | ------------------------------------------- |
| `network`        | Connection or network-related errors | API failures, connectivity issues           |
| `validation`     | Input validation errors              | Form validation, data format errors         |
| `authentication` | Authentication-related errors        | Login failures, expired sessions            |
| `authorization`  | Permission-related errors            | Access denied, insufficient permissions     |
| `server`         | Server-side errors                   | Internal server errors, service unavailable |
| `generic`        | General errors                       | Default fallback for unknown errors         |

## Props

### ErrorMessage Props

| Prop          | Type         | Default     | Description                             |
| ------------- | ------------ | ----------- | --------------------------------------- |
| `message`     | `string`     | -           | The error message to display (required) |
| `type`        | `ErrorType`  | `'generic'` | The type of error for styling and icon  |
| `onRetry`     | `() => void` | -           | Callback for retry button (optional)    |
| `className`   | `string`     | `''`        | Additional CSS classes                  |
| `showIcon`    | `boolean`    | `true`      | Whether to show the error icon          |
| `dismissible` | `boolean`    | `false`     | Whether to show dismiss button          |
| `onDismiss`   | `() => void` | -           | Callback for dismiss button             |

### ErrorMessageFromDomain Props

| Prop                                                            | Type                                 | Default | Description                     |
| --------------------------------------------------------------- | ------------------------------------ | ------- | ------------------------------- |
| `error`                                                         | `DomainException \| Error \| string` | -       | The error to display (required) |
| All other props from `ErrorMessage` except `message` and `type` |                                      |         |                                 |

## Styling

The component uses CSS modules with BEM methodology. Each error type has its own color scheme:

- **Network/Validation**: Yellow/amber theme for warnings
- **Authentication/Authorization/Server/Generic**: Red theme for critical errors

The component is fully responsive and includes:

- Mobile-friendly layout that stacks actions below content
- High contrast mode support
- Reduced motion support for accessibility
- Focus management for keyboard navigation

## Accessibility Features

- Uses `role="alert"` for screen readers
- Proper ARIA labels on interactive elements
- Icons are marked as `aria-hidden="true"`
- Keyboard navigation support
- High contrast mode compatibility

## Examples

### Network Error with Retry

```tsx
<ErrorMessage
  message="Unable to connect to the server. Please check your internet connection."
  type="network"
  onRetry={handleRetry}
/>
```

### Validation Error

```tsx
<ErrorMessage message="Please enter a valid email address." type="validation" />
```

### Authentication Error

```tsx
<ErrorMessage
  message="Your session has expired. Please log in again."
  type="authentication"
/>
```

### Server Error with Support Info

```tsx
<ErrorMessage
  message="A server error occurred. Please try again later or contact support if the problem persists."
  type="server"
  onRetry={handleRetry}
/>
```

### Using with Domain Errors in Components

```tsx
import { useGrade } from '../../adapters/controllers/useGrade';
import { ErrorMessageFromDomain, LoadingSpinner } from '../common';

const GradesList: React.FC = () => {
  const { grades, loading, error, refetch } = useGrade();

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <ErrorMessageFromDomain error={error} onRetry={refetch} />;
  }

  return (
    <div>
      {grades.map((grade) => (
        <div key={grade.id}>
          {grade.courseName}: {grade.grade}
        </div>
      ))}
    </div>
  );
};
```
