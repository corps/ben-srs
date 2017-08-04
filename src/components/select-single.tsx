import * as React from "react";
import {classNamesGeneratorFor} from "../utils/class-names-for";

const classNamesForSelectSingle = classNamesGeneratorFor<SelectSingleProps>(add => {
  add("value", <div className=""/>, <div className="gray"/>)
}, <div className="w-100 b--solid b---moon-gray bw1 br3 b--light-blue--hover bg-white h2"/>);

export interface SelectSingleProps {
  values: any[],
  labeler?: (t: any) => string,
  value?: any | 0
  onChange?: (v: any) => void
  placeholder?: string
}

const defaultLabeler = (o: any) => o + "";

export function SelectSingle(props: SelectSingleProps & { className?: string }) {
  let labeler = props.labeler || defaultLabeler;

  let onChange: (event: React.FormEvent<any>) => void = props.onChange ?
    (event: React.FormEvent<any>) => {
      let selected = (event.target as HTMLSelectElement).value;
      let valueNum = selected != null ? parseInt(selected, 10) : null;
      return props.onChange(props.values[valueNum])
    } : null;

  let valueIdx = -1;
  if (props.value) {
    valueIdx = props.values.indexOf(props.value);
  }

  return <select className={classNamesForSelectSingle(props)} value={valueIdx + ""} onChange={onChange}>
    <option key="-1" value="-1" label={props.placeholder}>{props.placeholder}</option>
    { valueIdx === -1 && props.value ?
      <option key="-1" value="-1" label={labeler(props.value)}>{labeler(props.value)}</option> :
      null }
    { props.values.map((value, idx) => {
      return <option key={idx + ""} value={idx + ""} label={labeler(value)}>{labeler(value)}</option>
    }) }
  </select>

