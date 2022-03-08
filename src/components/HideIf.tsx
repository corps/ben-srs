import React, {PropsWithChildren} from 'react';

interface Props {
  hidden?: boolean
}

export function HideIf({hidden, children}: PropsWithChildren<Props>) {
  return <div style={{display: hidden ? 'none' : 'block'}}>
    {children}
  </div>
}