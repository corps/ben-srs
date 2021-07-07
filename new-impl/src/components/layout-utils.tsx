import * as React from "react";
import {
  classNamesGeneratorFor, PropsWithChildrenAndClassName,
} from "../utils/class-names-for";
import {PropsWithChildren} from "react";

export interface FlexContainerOptions {
  topContainer?: boolean
  vertical?: boolean
  horizontal?: boolean
  key?: string
  id?: string
}

const classesForFlexContainer = classNamesGeneratorFor<FlexContainerOptions>(add => {
  add("topContainer", <div className="min-w8 min-vh-100"/>);
  add("vertical", <div className="flex-column"/>);
  add("horizontal", <div className="flex-row"/>);
}, <div className="flex flex-auto"/>);

export function FlexContainer(props: PropsWithChildrenAndClassName<FlexContainerOptions>) {
  return <div className={classesForFlexContainer(props)} key={props.key} id={props.id}>
    {props.children}
  </div>
}

export interface ColumnOptions {
  fixedColumn?: boolean
  stretchColumn?: boolean
}

const classesForColumn = classNamesGeneratorFor<ColumnOptions>(add => {
  add("fixedColumn", <div className="flex-none"/>);
  add("stretchColumn", <div className="flex-auto"/>);
}, <div className="flex-column flex items-stretch"/>);

export function Column(props: PropsWithChildrenAndClassName<ColumnOptions>) {
  return <div className={classesForColumn(props)}>
    {props.children}
  </div>;
}

export interface RowOptions {
  stretchRow?: boolean
  fixedRow?: boolean
}

const classesForRow = classNamesGeneratorFor<RowOptions>(add => {
  add("stretchRow", <div className="flex-auto"/>);
  add("fixedRow", <div className="flex-none"/>);
}, <div className="flex flex-row items-stretch"/>);

export function Row(props: PropsWithChildrenAndClassName<RowOptions>) {
  return <div className={classesForRow(props)}>
    {props.children}
  </div>
}

const classesForVCenteringContainer = classNamesGeneratorFor<{}>(
  add => {
  },
  <div className="dt w-100 h-100"/>
)

export function VCenteringContainer(props: PropsWithChildrenAndClassName<{}>) {
  return <div className={classesForVCenteringContainer(props)}>
    {props.children}
  </div>
}

const classesForVCentered = classNamesGeneratorFor<{}>(
  add => {
  },
  <div className="dtc v-mid"/>
);

export function VCentered(props: PropsWithChildrenAndClassName<{}>) {
  return <div className={classesForVCentered(props)}>
    {props.children}
  </div>;
}

const classesForVBottomed = classNamesGeneratorFor<{}>(
  add => {
  },
  <div className="dtc v-btm"/>
);

export function VBottomed(props: PropsWithChildrenAndClassName<{}>) {
  return <div className={classesForVBottomed(props)}>
    {props.children}
  </div>;
}