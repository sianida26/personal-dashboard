# Form Handling

## Overview

The frontend uses Mantine Forms with Zod validation for consistent, type-safe form handling. This approach ensures validation schemas are shared between frontend and backend, provides excellent developer experience, and maintains strict type safety throughout the form lifecycle.

## Form Architecture

### Core Technologies
- **Mantine Forms** - Form state management and validation
- **Zod** - Schema validation and type inference
- **React Hook Form** - Alternative for complex forms
- **TanStack Query** - Form submission and mutation handling

### Form Patterns
- Configuration-driven form generation
- Type-safe validation schemas
- Automatic error handling and display
- Loading states during submission
- Success/error feedback via notifications

## Basic Form Implementation

### Simple Form with Validation
```tsx
// src/components/forms/UserForm.tsx
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import { TextInput, Button, Stack } from '@mantine/core';

const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  role: z.enum(['admin', 'user'], { message: 'Role is required' }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isLoading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<UserFormValues>({
    initialValues: {
      name: '',
      email: '',
      username: '',
      role: 'user',
      ...initialValues,
    },
    validate: zodResolver(userFormSchema),
  });

  const handleSubmit = async (values: UserFormValues) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Name"
          placeholder="Enter full name"
          {...form.getInputProps('name')}
        />
        
        <TextInput
          label="Email"
          type="email"
          placeholder="Enter email address"
          {...form.getInputProps('email')}
        />
        
        <TextInput
          label="Username"
          placeholder="Enter username"
          {...form.getInputProps('username')}
        />
        
        <Select
          label="Role"
          placeholder="Select role"
          data={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Administrator' },
          ]}
          {...form.getInputProps('role')}
        />
        
        <Button type="submit" loading={isLoading}>
          Submit
        </Button>
      </Stack>
    </form>
  );
};
```

### Form with Mutation Integration
```tsx
// src/components/forms/CreateUserForm.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/honoClient';
import { showNotification } from '@/utils/notifications';
import { UserForm } from './UserForm';

export const CreateUserForm = () => {
  const queryClient = useQueryClient();
  
  const createUser = useMutation({
    mutationFn: (userData: UserFormValues) => 
      client.users.$post({ json: userData }),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification({
        message: 'User created successfully',
        color: 'green',
      });
    },
    onError: (error) => {
      showNotification({
        message: error.message || 'Failed to create user',
        color: 'red',
      });
    },
  });

  return (
    <UserForm
      onSubmit={createUser.mutateAsync}
      isLoading={createUser.isPending}
    />
  );
};
```

## Advanced Form Patterns

### Modal Form Template
```tsx
// src/components/forms/ModalFormTemplate.tsx
import { Modal, Button, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';

interface ModalFormTemplateProps<T extends z.ZodSchema> {
  title: string;
  opened: boolean;
  onClose: () => void;
  schema: T;
  initialValues?: Partial<z.infer<T>>;
  onSubmit: (values: z.infer<T>) => Promise<void>;
  renderForm: (form: ReturnType<typeof useForm<z.infer<T>>>) => React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  closeOnSuccess?: boolean;
}

export const ModalFormTemplate = <T extends z.ZodSchema>({
  title,
  opened,
  onClose,
  schema,
  initialValues,
  onSubmit,
  renderForm,
  size = 'md',
  closeOnSuccess = true,
}: ModalFormTemplateProps<T>) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<T>>({
    initialValues: initialValues || {},
    validate: zodResolver(schema),
  });

  const handleSubmit = async (values: z.infer<T>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      if (closeOnSuccess) {
        onClose();
      }
      form.reset();
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size={size}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {renderForm(form)}
          
          <Group justify="flex-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

// Usage
export const CreateUserModal = () => {
  const [opened, setOpened] = useState(false);
  
  return (
    <ModalFormTemplate
      title="Create User"
      opened={opened}
      onClose={() => setOpened(false)}
      schema={userFormSchema}
      onSubmit={async (values) => {
        await client.users.$post({ json: values });
      }}
      renderForm={(form) => (
        <>
          <TextInput
            label="Name"
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Email"
            {...form.getInputProps('email')}
          />
        </>
      )}
    />
  );
};
```

### Dynamic Form Generation
```tsx
// src/components/forms/DynamicForm.tsx
import { createInputComponents } from '@/utils/formUtils';

interface FormFieldConfig {
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: z.ZodSchema;
}

interface DynamicFormProps {
  fields: Record<string, FormFieldConfig>;
  schema: z.ZodSchema;
  onSubmit: (values: any) => Promise<void>;
  initialValues?: Record<string, any>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  schema,
  onSubmit,
  initialValues = {},
}) => {
  const form = useForm({
    initialValues,
    validate: zodResolver(schema),
  });

  const inputComponents = createInputComponents(fields);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        {Object.entries(fields).map(([key, config]) => (
          <div key={key}>
            {inputComponents[key](form.getInputProps(key))}
          </div>
        ))}
        
        <Button type="submit">Submit</Button>
      </Stack>
    </form>
  );
};
```

## Input Components

### Type-Safe Input Generation
```typescript
// src/utils/formUtils.ts
import { TextInput, Select, MultiSelect, Checkbox, Textarea, NumberInput, PasswordInput } from '@mantine/core';

export const createInputComponents = (fieldConfigs: Record<string, FormFieldConfig>) => {
  const components: Record<string, React.ComponentType<any>> = {};

  Object.entries(fieldConfigs).forEach(([key, config]) => {
    components[key] = (props) => {
      const baseProps = {
        label: config.label,
        placeholder: config.placeholder,
        required: config.required,
        ...props,
      };

      switch (config.type) {
        case 'text':
          return <TextInput {...baseProps} />;
        
        case 'email':
          return <TextInput type="email" {...baseProps} />;
        
        case 'password':
          return <PasswordInput {...baseProps} />;
        
        case 'number':
          return <NumberInput {...baseProps} />;
        
        case 'textarea':
          return <Textarea {...baseProps} />;
        
        case 'select':
          return (
            <Select
              {...baseProps}
              data={config.options || []}
            />
          );
        
        case 'multiselect':
          return (
            <MultiSelect
              {...baseProps}
              data={config.options || []}
            />
          );
        
        case 'checkbox':
          return (
            <Checkbox
              {...baseProps}
              label={config.label}
            />
          );
        
        default:
          return <TextInput {...baseProps} />;
      }
    };
  });

  return components;
};
```

### Conditional Fields
```tsx
// src/components/forms/ConditionalForm.tsx
export const ConditionalForm = () => {
  const form = useForm({
    initialValues: {
      userType: 'individual',
      name: '',
      companyName: '',
      taxId: '',
    },
  });

  const userType = form.values.userType;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Select
          label="User Type"
          data={[
            { value: 'individual', label: 'Individual' },
            { value: 'company', label: 'Company' },
          ]}
          {...form.getInputProps('userType')}
        />
        
        {userType === 'individual' && (
          <TextInput
            label="Full Name"
            {...form.getInputProps('name')}
          />
        )}
        
        {userType === 'company' && (
          <>
            <TextInput
              label="Company Name"
              {...form.getInputProps('companyName')}
            />
            <TextInput
              label="Tax ID"
              {...form.getInputProps('taxId')}
            />
          </>
        )}
        
        <Button type="submit">Submit</Button>
      </Stack>
    </form>
  );
};
```

## Form Validation

### Custom Validation Rules
```typescript
// src/utils/validation.ts
import { z } from 'zod';

// Custom validators
export const passwordValidator = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const phoneValidator = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');

export const urlValidator = z
  .string()
  .url('Invalid URL format')
  .optional()
  .or(z.literal(''));

// Complex validation schemas
export const userRegistrationSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: passwordValidator,
  confirmPassword: z.string(),
  phone: phoneValidator.optional(),
  website: urlValidator,
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

### Server-Side Validation Integration
```tsx
// src/hooks/useFormSubmission.ts
import { useMutation } from '@tanstack/react-query';
import { showNotification } from '@/utils/notifications';

export const useFormSubmission = <T>(
  mutationFn: (values: T) => Promise<any>,
  options?: {
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
  }
) => {
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      showNotification({
        message: 'Form submitted successfully',
        color: 'green',
      });
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      // Handle validation errors from server
      if (error.status === 400 && error.data?.errors) {
        const validationErrors = error.data.errors;
        Object.entries(validationErrors).forEach(([field, message]) => {
          form.setFieldError(field, message as string);
        });
      } else {
        showNotification({
          message: error.message || 'Form submission failed',
          color: 'red',
        });
      }
      options?.onError?.(error);
    },
  });
};
```

## Form State Management

### Complex Form State
```tsx
// src/components/forms/MultiStepForm.tsx
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { Stepper, Button, Group } from '@mantine/core';

interface MultiStepFormProps {
  steps: Array<{
    label: string;
    description?: string;
    component: React.ComponentType<{ form: any }>;
    validation?: (values: any) => Record<string, string>;
  }>;
  onSubmit: (values: any) => Promise<void>;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  onSubmit,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const form = useForm({
    initialValues: {},
  });

  const nextStep = () => {
    // Validate current step
    const currentStepValidation = steps[activeStep].validation;
    if (currentStepValidation) {
      const errors = currentStepValidation(form.values);
      if (Object.keys(errors).length > 0) {
        form.setErrors(errors);
        return;
      }
    }
    
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const prevStep = () => {
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (values: any) => {
    await onSubmit(values);
  };

  const CurrentStepComponent = steps[activeStep].component;

  return (
    <div>
      <Stepper active={activeStep} onStepClick={setActiveStep}>
        {steps.map((step, index) => (
          <Stepper.Step
            key={index}
            label={step.label}
            description={step.description}
          />
        ))}
      </Stepper>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <CurrentStepComponent form={form} />
        
        <Group justify="space-between" mt="xl">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={activeStep === 0}
          >
            Previous
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button type="submit">Submit</Button>
          ) : (
            <Button onClick={nextStep}>Next</Button>
          )}
        </Group>
      </form>
    </div>
  );
};
```

### Form Persistence
```tsx
// src/hooks/useFormPersistence.ts
import { useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';

export const useFormPersistence = <T extends Record<string, any>>(
  key: string,
  form: ReturnType<typeof useForm<T>>,
  options?: {
    debounceMs?: number;
    exclude?: (keyof T)[];
  }
) => {
  const [savedValues, setSavedValues] = useLocalStorage<Partial<T>>({
    key: `form-${key}`,
    defaultValue: {},
  });

  // Load saved values on mount
  useEffect(() => {
    if (Object.keys(savedValues).length > 0) {
      form.setValues(savedValues);
    }
  }, []);

  // Save values on change
  useEffect(() => {
    const timer = setTimeout(() => {
      const valuesToSave = { ...form.values };
      
      // Exclude specified fields
      if (options?.exclude) {
        options.exclude.forEach(field => {
          delete valuesToSave[field];
        });
      }
      
      setSavedValues(valuesToSave);
    }, options?.debounceMs || 1000);

    return () => clearTimeout(timer);
  }, [form.values]);

  const clearSavedValues = () => {
    setSavedValues({});
  };

  return { clearSavedValues };
};
```

## File Upload Forms

### File Upload Component
```tsx
// src/components/forms/FileUploadForm.tsx
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { Text, Group, rem } from '@mantine/core';
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react';

interface FileUploadFormProps {
  onUpload: (files: FileWithPath[]) => Promise<void>;
  maxSize?: number;
  accept?: string[];
  multiple?: boolean;
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
  onUpload,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = ['image/*'],
  multiple = false,
}) => {
  const handleDrop = async (files: FileWithPath[]) => {
    try {
      await onUpload(files);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <Dropzone
      onDrop={handleDrop}
      maxSize={maxSize}
      accept={accept}
      multiple={multiple}
    >
      <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload size={rem(52)} stroke={1.5} />
        </Dropzone.Accept>
        
        <Dropzone.Reject>
          <IconX size={rem(52)} stroke={1.5} />
        </Dropzone.Reject>
        
        <Dropzone.Idle>
          <IconPhoto size={rem(52)} stroke={1.5} />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Drag files here or click to select
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            Attach files (max {maxSize / 1024 / 1024}MB each)
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
};
```

## Error Handling

### Form Error Display
```tsx
// src/components/forms/FormErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';
import { Alert, Button } from '@mantine/core';

const FormErrorFallback = ({ error, resetErrorBoundary }) => (
  <Alert color="red" title="Form Error">
    <Text>Something went wrong with the form:</Text>
    <Text size="sm" color="dimmed" mt="xs">
      {error.message}
    </Text>
    <Button size="sm" mt="md" onClick={resetErrorBoundary}>
      Try again
    </Button>
  </Alert>
);

export const FormErrorBoundary = ({ children }) => (
  <ErrorBoundary FallbackComponent={FormErrorFallback}>
    {children}
  </ErrorBoundary>
);
```

### Validation Error Handling
```tsx
// src/utils/formErrors.ts
export const handleFormErrors = (
  error: any,
  form: ReturnType<typeof useForm>
) => {
  if (error.status === 400 && error.data?.errors) {
    // Server validation errors
    const serverErrors = error.data.errors;
    form.setErrors(serverErrors);
  } else if (error.status === 422) {
    // Unprocessable entity
    showNotification({
      message: 'Please check your input and try again',
      color: 'red',
    });
  } else {
    // Generic error
    showNotification({
      message: error.message || 'An error occurred',
      color: 'red',
    });
  }
};
```

## Best Practices

### Form Organization
- Use consistent validation schemas
- Implement proper error handling
- Provide clear user feedback
- Use loading states appropriately
- Implement form persistence where needed

### Performance Optimization
- Debounce validation for expensive operations
- Use memo for complex form components
- Implement proper field dependencies
- Optimize re-renders with proper key usage

### Accessibility
- Proper form labels and ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Clear error messages and instructions

### Testing
- Test form validation logic
- Test form submission flows
- Test error handling scenarios
- Test accessibility features

## Related Documentation

- [Component Patterns](./component-patterns.md) - Form component templates
- [Data Management](./data-management.md) - Form submission and mutations
- [Validation](./validation.md) - Schema validation patterns
- [Error Handling](./error-handling.md) - Form error management
