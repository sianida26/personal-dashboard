import type React from 'react';
import { createContext, useContext, useState, type ReactNode } from 'react'

/**
 * Type representing the state for the application.
 *
 * Add additional custom state properties as needed.
 */
type AppState = {
    // Add custom state properties here
};

/**
 * Interface for the App Context used to provide the application state
 * and its updater function.
 */
type AppContextType = {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
};

/**
 * Creates a React context for the application.
 * The context is initially undefined until provided via AppProvider.
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Props for the AppProvider component.
 */
type AppProviderProps = {
    children: ReactNode;
};

/**
 * AppProvider component that wraps the application and provides the AppContext.
 *
 * @param {AppProviderProps} props - Component children that will have access to the context.
 * @returns {JSX.Element} AppContext provider wrapper.
 *
 * @example
 * // Wrap your component tree with AppProvider in your main file:
 * import React from 'react';
 * import ReactDOM from 'react-dom/client';
 * import { AppProvider } from './contexts/App/AppContext';
 * import App from './App';
 *
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <AppProvider>
 *     <App />
 *   </AppProvider>
 * );
 */
export const AppProvider = ({ children }: AppProviderProps) => {
    const [state, setState] = useState<AppState>({});

    return (
        <AppContext.Provider value={{ state, setState }}>
            {children}
        </AppContext.Provider>
    );
};

/**
 * Custom hook that provides the AppContext value.
 *
 * @returns {AppContextType} The current context value.
 *
 * @throws Will throw an error if the hook is used outside an AppProvider.
 *
 * @example
 * // In a component:
 * import React from 'react';
 * import { useAppContext } from './contexts/App/AppContext';
 *
 * const MyComponent = () => {
 *   const { state, setState } = useAppContext();
 *
 *   // Use state and setState accordingly
 *
 *   return <div>My Component</div>;
 * };
 */
export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

/**
 * USAGE EXAMPLE:
 *
 * // index.tsx or App.tsx (main file)
 * import React from 'react';
 * import ReactDOM from 'react-dom/client';
 * import { AppProvider } from './contexts/App/AppContext';
 * import App from './App';
 *
 * const root = ReactDOM.createRoot(document.getElementById('root')!);
 * root.render(
 *   <AppProvider>
 *     <App />
 *   </AppProvider>
 * );
 *
 * // In any child component:
 * import React from 'react';
 * import { useAppContext } from './contexts/App/AppContext';
 *
 * const SomeComponent = () => {
 *   const { state, setState } = useAppContext();
 *
 *   // Modify or utilize state here
 *
 *   return <div>Component Content</div>;
 * };
 */