import * as React from "react";
import {ClassAndChildren, classNamesGeneratorFor} from "../utils/class-names-for";
import {Counts} from "../state";

export interface CountsRowProps {
  counts: Counts
  postfix?: string
}

const classNames = classNamesGeneratorFor<CountsRowProps>(add => {
}, <div className="tc f3 fw2 mb1"/>);

export function CountsRow(props: CountsRowProps & ClassAndChildren) {
  return <div className={classNames(props)}>
    <span className="mr2">{props.children}</span>
    <span className="f5 ml1">日</span>
    {props.counts.today}{props.postfix}
    <span className="f5 ml1">週</span>
    {props.counts.week}{props.postfix}
    <span className="f5 ml1">月</span>
    {props.counts.month}{props.postfix}
  </div>
}