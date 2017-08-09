import *  as React from "react";
import {ClassAndChildren, classNamesGeneratorFor} from "../utils/class-names-for";

const classNames = classNamesGeneratorFor<CharacterCellProps>(add => {
  add("selected", <div className="bg-light-green fw5"/>);
  add("isTerm", <div className="bg-orange"/>);
  add("onClick", <div className="pointer"/>);
}, <div className="w1 pv1 dib tc"/>);

export interface CharacterCellProps {
  selected?: boolean
  isTerm?: boolean
  onClick?: React.MouseEventHandler<any>
}

export function CharacterCell(props: CharacterCellProps & ClassAndChildren) {
  return <div onClick={props.onClick} className={classNames(props)}>
    {props.children}
  </div>
}