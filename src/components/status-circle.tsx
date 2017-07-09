import * as React from "react";
import {classNamesGeneratorFor} from "../utils/class-names-for";

export interface StatusCircleProps {

}

const classNameGen = classNamesGeneratorFor<StatusCircleProps>(add => {

}, <div className="h3 w3 br-100 inset-shadow"/>);

export function StatusCircle(props: StatusCircleProps) {
  return <div className={classNameGen(props)}>
  </div>
}