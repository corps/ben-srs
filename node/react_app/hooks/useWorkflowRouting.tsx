import React from 'react';
import { ReactElement, useCallback } from 'react';
import { some } from '../../shared/maybe';
import { useRoute } from './useRoute';

export type WorkflowParams<Apply extends any[]> = {
  onReturn?: () => void;
  onApply: (...args: Apply) => Promise<void>;
};
export type WithWorkflowParams<P extends {}, Apply extends any[]> = P &
  WorkflowParams<Apply>;

export type WorkflowComponent<P extends {}, Apply extends any[]> = (
  p: WithWorkflowParams<P, Apply>
) => ReactElement<any, any> | null;

export function useWorkflowRouting<
  P extends {},
  Apply extends any[],
  SourceProps extends {}
>(
  Destination: WorkflowComponent<P, Apply>,
  Source: ((props: SourceProps) => ReactElement<any, any> | null) | null,
  apply: (...args: Apply) => Promise<void> = () => Promise.resolve()
) {
  const [_, setRoute] = useRoute();

  const routingParams = useCallback(
    (
      props: SourceProps,
      updated: (...args: Apply) => SourceProps = () => props
    ): WorkflowParams<Apply> => {
      const result = {
        async onApply(...args: Apply): Promise<void> {
          try {
            const update = apply(...args);
            if (Source) setRoute(() => some(<Source {...updated(...args)} />));
            else setRoute(() => null);
            await update;
          } catch (e) {
            console.error(e);
          }
        },
        onReturn() {
          if (Source) setRoute(() => some(<Source {...props} />));
          else setRoute(() => null);
        }
      };

      return result;
    },
    [Source, apply, setRoute]
  );

  return useCallback(
    (
      destProps: Omit<P, 'onApply' | 'onReturn'>,
      sourceProps: SourceProps,
      updated: (...args: Apply) => SourceProps = () => sourceProps
    ) => {
      setRoute(() =>
        some(
          <Destination
            {...{ ...(destProps as P), ...routingParams(sourceProps, updated) }}
          />
        )
      );
    },
    [Destination, routingParams, setRoute]
  );
}
