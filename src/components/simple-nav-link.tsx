import {ClassAndChildren, classNamesGeneratorFor} from "../utils/class-names-for";
import * as React from "react";

export interface SimpleNavLinkProps {
  onClick?: React.MouseEventHandler<any>
  hide?: boolean
}

const classNames = classNamesGeneratorFor<SimpleNavLinkProps>(add => {
  add("onClick", <div className="pointer blue hover-light-blue"/>, <div className=""/>);
  add("hide", <div className="dn"/>);
}, <div className="underline mh1"/>);

export function SimpleNavLink(props: SimpleNavLinkProps & ClassAndChildren) {
  return <span
    onClick={props.onClick}
    className={classNames(props)}>
    {props.children}
  </span>;
}