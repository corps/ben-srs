import {classNamesGeneratorFor, PropsWithChildrenAndClassName} from "../utils/class-names-for";
import * as React from "react";
import {MouseEventHandler, PropsWithChildren, useCallback} from "react";
import {useWithKeybinding} from "../hooks/useWithKeybinding";

export interface SimpleNavLinkProps {
  onClick?: (() => void) | null,
  hide?: boolean
  disabled?: boolean,
}

const classNames = classNamesGeneratorFor<SimpleNavLinkProps>(add => {
  add("onClick", <div className="pointer blue hover-light-blue"/>, <div className=""/>);
  add("hide", <div className="dn"/>);
  add("disabled", <div className="dark-gray bg-light-gray"/>);
}, <div className="underline mh1"/>);

export function SimpleNavLink(props: PropsWithChildrenAndClassName<SimpleNavLinkProps>) {
  const onClick: MouseEventHandler = useCallback((e) => {
    if (props.onClick) props.onClick();
    return false;
  }, [props]);

  return <span
    onClick={onClick}
    className={classNames(props)}>
    {props.children}
  </span>;
}

interface WorkflowLinksProps {
  onApply?: () => void,
  onReturn?: () => void,
  hasEdits?: boolean,
  applyDisabled?: boolean,
}

export function WorkflowLinks(props: PropsWithChildren<WorkflowLinksProps>) {
  let {onReturn, onApply, hasEdits, applyDisabled, children} = props;

  let [ReturnWrapper] = useWithKeybinding('Escape', useCallback((wasKey) => {
    if (!wasKey || !hasEdits || confirm('Are you sure you want to cancel?')) {
      onReturn && onReturn();
    }
  }, [hasEdits, onReturn]))

  let [ApplyWrapper] = useWithKeybinding('Enter', useCallback((wasKey) => {
    if (!applyDisabled && onApply) onApply();
  }, [applyDisabled, onApply]))

  return <>
    { onApply ? <SimpleNavLink className="mh1 pa2 br2" onClick={applyDisabled ? null : onApply} disabled={applyDisabled}>
      <ApplyWrapper>コミット</ApplyWrapper>
    </SimpleNavLink> : null }

    { onReturn ? <SimpleNavLink className="mh1 pa2 br2" onClick={onReturn}>
      <ReturnWrapper>戻る</ReturnWrapper>
    </SimpleNavLink> : null }

    {children}
  </>
}