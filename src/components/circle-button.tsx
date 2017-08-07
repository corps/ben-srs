import * as React from "react";
import {ClassAndChildren, classNamesGeneratorFor} from "../utils/class-names-for";

export interface CircleButtonProps {
  red?: boolean
  green?: boolean
  blue?: boolean
  yellow?: boolean
}

const circleClassNames = classNamesGeneratorFor<CircleButtonProps>(add => {
  add("red", <div className="bg-red"/>);
  add("green", <div className="bg-green"/>);
  add("blue", <div className="bg-blue"/>);
  add("yellow", <div className="bg-yellow"/>);
}, <div className="br-100 dib f2 shadow-1 tc"/>);

export function CircleButton(props: CircleButtonProps & ClassAndChildren) {
  return <div className={circleClassNames(props)}>
    <div className="dt w4 h4 f2-ns f4">
      <div className="dtc v-mid tc white">
        {props.children}
      </div>
    </div>
  </div>
}