import {classNamesGeneratorFor, PropsWithChildrenAndClassName} from "../utils/class-names-for";
import * as React from "react";
import {MouseEventHandler, useCallback} from "react";

export interface SimpleNavLinkProps {
  onClick?: () => void,
  hide?: boolean
}

const classNames = classNamesGeneratorFor<SimpleNavLinkProps>(add => {
  add("onClick", <div className="pointer blue hover-light-blue"/>, <div className=""/>);
  add("hide", <div className="dn"/>);
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