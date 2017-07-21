import * as React from "react";
import {ClassAndChildren, classNamesGeneratorFor} from "../utils/class-names-for";
import {Column, FlexContainer, Row} from "./layout-utils";
import {ProgressBar} from "./progress-bar";

export interface PageLayoutProps {
  dark?: boolean
  awaiting?: number
  nav: (JSX.Element | string | number)[] | JSX.Element | string | number
}

interface NavContainerProps {
  columnStyle?: boolean
}

const pageLayoutClassNames = classNamesGeneratorFor<PageLayoutProps>(add => {
  add("dark", <div className="bg-black-80 near-white"/>);
}, <div className="overflow-y-hidden kokoro"/>);

const navContainerClassNames = classNamesGeneratorFor<PageLayoutProps & NavContainerProps>(add => {
  add("dark", <div className="bg-mid-gray"/>);
  add("columnStyle",
    <div className="pa4-m"/>,
    <div className="dn-ns h3 pa3"/>);
}, <div className="overflow-y-hidden kokoro"/>);

export function PageLayout(props: PageLayoutProps & ClassAndChildren) {
  return <FlexContainer topContainer vertical className={pageLayoutClassNames(props)}>
    <Row fixedRow className="h_25">
      <ProgressBar tasksNum={props.awaiting}/>
    </Row>
    <Row fixedRow className={navContainerClassNames({...props, columnStyle: false})}>
      {props.nav}
    </Row>
    <Row stretchRow>
      <FlexContainer horizontal className="">
        <Column stretchColumn>
          <div className="h-100 w-100">
            {props.children}
          </div>
        </Column>
        <Column fixedColumn className={navContainerClassNames({...props, columnStyle: true})}>
          {props.nav}
        </Column>
      </FlexContainer>
    </Row>
  </FlexContainer>
}