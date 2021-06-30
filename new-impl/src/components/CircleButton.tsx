import React from 'react';
import {classNamesGeneratorFor} from "../utils/class-names-for";

export interface CircleButtonProps {
  red?: boolean
  green?: boolean
  blue?: boolean
  yellow?: boolean
  purple?: boolean
  onClick?: React.MouseEventHandler<any>
}

const circleClassNames = classNamesGeneratorFor<CircleButtonProps>(add => {
  add("red", <div className="bg-red"/>);
  add("green", <div className="bg-green"/>);
  add("blue", <div className="bg-blue"/>);
  add("yellow", <div className="bg-yellow"/>);
  add("purple", <div className="bg-light-purple"/>);
}, <div className="br-100 dib f2 shadow-1 tc"/>);

export function CircleButton(props: React.PropsWithChildren<CircleButtonProps>) {
  return <div className={circleClassNames(props)} onClick={props.onClick}>
    <div className="dt w4 h4 f2-ns f4">
      <div className="dtc v-mid tc white">
        {props.children}
      </div>
    </div>
  </div>
}