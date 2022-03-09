import React from 'react';
import {Dispatch, ReactElement, useCallback, useState} from "react";
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
  apply: (...args: Apply) => Promise<void> = () => Promise.resolve(),
) {
  const setRoute = useRoute();

  const routingParams = useCallback((
    props: SourceProps,
    updated: (...args: Apply) => SourceProps = () => props,
  ): WorkflowParams<Apply> => {
    const result = {
      async onApply(...args: Apply): Promise<void> {
        try {
          // Swap the route immediately, allow the apply function to resolve in the background.
          setRoute(() => some(<Source {...(updated(...args))}/>))
          await apply(...args);
        } catch (e) {
          console.error(e);
        }
      },
      onReturn() {
        setRoute(() => some(
          <Source {...props}/>
        ))
      }
    };

    // result.onApply.description =  applyString;
    // result.onReturn.toString = () => returnString;

    return result;
  }, [Source, apply, setRoute])

  return useCallback((
    destProps: Omit<P, "onApply" | "onReturn">, sourceProps: SourceProps,
    updated: (...args: Apply) => SourceProps = () => sourceProps,
  ) => {
    setRoute(() => some(
      <Destination {...{...(destProps as P), ...routingParams(sourceProps, updated)}} />
    ))
  }
  , [Destination, routingParams, setRoute]);
}