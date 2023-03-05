import React, { useCallback, useState } from 'react';
import { WorkflowLinks } from './SimpleNavLink';
import { useWithKeybinding } from '../hooks/useWithKeybinding';
import { speak } from '../hooks/useSpeechAndAudio';
import { useStudyContext } from '../hooks/useStudyContext';
import { useRoute } from '../hooks/useRoute';
import { useAsync } from '../hooks/useWithContext';
import { BensrsClient } from '../services/bensrs';
import { runPromise } from '../cancellable';
import { withDefault } from '../../shared/maybe';

interface Props {
  prompt: string;
  onReturn?: () => void;
}

export function Completion(props: Props) {
  const [_, setRoute] = useRoute();
  const { onReturn = () => setRoute(() => null) } = props;

  const [result, error] = useAsync(
    function* () {
      const client = new BensrsClient();
      const res = yield* runPromise(
        client.callJson(BensrsClient.CompletionEndpoint, {
          prompt: props.prompt
        })
      );
      if ('success' in res) {
        throw new Error('Failed to contact completions server!');
      }

      return res.response;
    },
    [props.prompt],
    () => {}
  );
  return (
    <div className="mw6 center">
      <div className="tc">
        <WorkflowLinks onReturn={onReturn} />
      </div>
      <div className="lh-copy f4 tc mt3">
        <div>{withDefault(result, withDefault(error, ''))}</div>
        <br />
        <div>{props.prompt}</div>
      </div>
    </div>
  );
}
