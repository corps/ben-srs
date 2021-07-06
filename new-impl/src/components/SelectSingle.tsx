import React, {useCallback} from "react";
import {classNamesGeneratorFor} from "../utils/class-names-for";

const classNamesForSelectSingle = classNamesGeneratorFor<SelectSingleProps>(add => {
  add("value", <div className=""/>, <div className="gray"/>)
}, <div className="w-100 b--solid bw1 br3 bg-white h2"/>);

export interface SelectSingleProps {
  values: any[],
  labeler?: (t: any) => string,
  value?: any | 0
  onChange?: (v: any) => void
  placeholder?: string
}

const defaultLabeler = (o: any) => o + "";

export function SelectSingle(props: SelectSingleProps & { className?: string }) {
  const {labeler = defaultLabeler, values, value, onChange: changeCb, placeholder, className} = props;
  const onChange = useCallback((event: React.FormEvent<any>) => {
    const selected = (event.target as HTMLSelectElement).value;
    const valueNum = parseInt(selected, 10);
    changeCb && changeCb(values[valueNum])
  }, []);

  let valueIdx = -1;
  if (value) {
    valueIdx = values.indexOf(value);
  }

  return <select className={classNamesForSelectSingle(props)} value={valueIdx + ""} onChange={onChange}>
    { props.placeholder ? <option key="-1" value="-1" label={props.placeholder}>{props.placeholder}</option> : null }
    { valueIdx === -1 && props.value ?
      <option key="-1" value="-1" label={labeler(props.value)}>{labeler(props.value)}</option> :
      null }
    { props.values.map((value, idx) => {
      return <option key={idx + ""} value={idx + ""} label={labeler(value)}>{labeler(value)}</option>
    }) }
  </select>
}
