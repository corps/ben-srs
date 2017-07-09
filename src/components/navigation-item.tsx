import * as React from "react";
import {ClassAndChildren, classNamesGeneratorFor} from "../utils/class-names-for";

export interface NavigationItemProps {
  red?: boolean
  yellow?: boolean
}

const classNames = classNamesGeneratorFor<NavigationItemProps>(add => {
  add("red", <div className="b--light-red"/>);
  add("yellow", <div className="b--light-yellow"/>);
}, <div className="pv2 ph3 pointer"/>);

export function NavigationItem(props: NavigationItemProps & ClassAndChildren) {
  return <div className={classNames(props)}>
    <div className="b--inherit bb bw1 bt-0 br-0 bl-0">
      <div className="grow bg-animate pb2">
        {props.children}
      </div>
    </div>
  </div>
}