import {ReactElement, useCallback} from "react";
import {useRoute} from "./contexts";
import {some} from "../utils/maybe";

export type WorkflowParams<Apply extends any[]> = {
  onReturn?: () => void,
  onApply: (...args: Apply) => Promise<void>,
};
export type WithWorkflowParams<P extends {}, Apply extends any[]> = P & WorkflowParams<Apply>;

export type WorkflowComponent<P extends {}, Apply extends any[]> = (p: WithWorkflowParams<P, Apply>) => ReactElement<any, any> | null;

export function useWorkflowRouting<P extends {}, Apply extends any[], SourceProps extends {}>(
  Destination: WorkflowComponent<P, Apply>,
  Source: (props: SourceProps) => ReactElement<any, any> | null,
) {
  const setRoute = useRoute();

  const routingParams = useCallback((
    props: SourceProps,
    updated: (...args: Apply) => SourceProps,
  ): WorkflowParams<Apply> => {
    return {
      async onApply(...args: Apply): Promise<void> {
        setRoute(() => some(
          <Source {...(updated(...args))}/>
        ))
      },
      onReturn() {
        setRoute(() => some(
          <Source {...props}/>
        ))
      }
    }
  }, [Source, setRoute])

  return useCallback((destProps: Omit<P, "onApply" | "onReturn">, sourceProps: SourceProps, updated: (...args: Apply) => SourceProps) => {
    setRoute(() => some(
      <Destination {...{...(destProps as P), ...routingParams(sourceProps, updated)}} />
    ))
  }, [Destination, routingParams, setRoute]);
}