import React, { FC, PropsWithChildren, ReactElement } from 'react';

export function joinContext(
  node: ReactElement,
  ...nodes: FC<PropsWithChildren<{}>>[]
): ReactElement {
  return nodes.reduce(
    (child: ReactElement, Node: FC<PropsWithChildren<{}>>) => (
      <Node>{child}</Node>
    ),
    node
  );
}
