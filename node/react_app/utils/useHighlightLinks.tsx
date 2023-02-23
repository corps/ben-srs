import React, { useEffect, useRef } from 'react';

export function useHighlightLinks(deps: any[]) {
  const thisEl = useRef<HTMLElement>(null);

  useEffect(() => {
    const { current } = thisEl;
    if (!current) return;

    const stack: HTMLElement[] = [current];
    while (stack.length > 0) {
      const next = stack.pop();
      if (!next) break;
      if (next.children.length > 0) {
        for (let i = 0; i < next.children.length; ++i) {
          const node = next.children.item(i);
          if (node instanceof HTMLElement) {
            stack.push(node);
          }
        }
      }

      const { textContent } = next;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thisEl, ...deps]);

  return thisEl;
}
