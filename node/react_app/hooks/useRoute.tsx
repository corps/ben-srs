import { makeContextual } from './makeContextual';
import { ReactElement, useState } from 'react';
import { Maybe } from '../../shared/maybe';

export const [useRoute, RouteContext] = makeContextual(function useRoute() {
  return useState(null as Maybe<ReactElement>);
});
