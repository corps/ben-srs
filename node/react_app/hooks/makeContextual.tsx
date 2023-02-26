import {
  createContext,
  FC,
  PropsWithChildren,
  Provider,
  ReactElement,
  useCallback,
  useContext,
  useState
} from 'react';
import { Tuple } from '../../shared/tuple';

export function makeContextual<T>(
  factory: () => T
): Tuple<() => T, FC<PropsWithChildren<{}>>> {
  const FactoryContext = createContext<() => T>(factory);
  function useFromContext(): T {
    return useContext(FactoryContext)();
  }

  function ProviderBlock({ children }: PropsWithChildren<{}>) {
    const inner = factory();
    const cb = useCallback(() => inner, [inner]);

    return (
      <FactoryContext.Provider value={cb}>{children}</FactoryContext.Provider>
    );
  }

  return Tuple.from(useFromContext, ProviderBlock);
}
