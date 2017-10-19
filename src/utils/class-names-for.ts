import * as React from "react";

export interface ClassAndChildren {
  className?: string;
  children?: (JSX.Element | string | number)[] | JSX.Element | string | number;
  [k: string]: any;
}

export interface StyleAdder<T extends ClassAndChildren> {
  (
    k: keyof T,
    e: React.ReactElement<{className: string}>,
    inverse?: React.ReactElement<{className: string}>
  ): void;
  match?<K extends keyof T>(
    key: K,
    value: T[K],
    e: React.ReactElement<{className: string}>
  ): void;
}

export function classNamesGeneratorFor<T extends ClassAndChildren>(
  initializer: (add: StyleAdder<T>) => void,
  defaults: React.ReactElement<{className: string}> = null,
  ignoreGivenStyles = false
): (properties: T) => string {
  const classesForProps = {} as {[k: string]: string};
  const classesForMatches = {} as {[k: string]: [any, string][]};
  const classesForInverseProps = {} as {[k: string]: string};
  const defaultStyle =
    defaults && defaults.props.className ? defaults.props.className : "";

  const adder: StyleAdder<T> = (k, e, inverse) => {
    if (k in classesForProps) {
      throw new Error("Duplicate class definition for " + k);
    }
    classesForProps[k] = e.props.className;
    if (inverse) {
      classesForInverseProps[k] = inverse.props.className;
    }
  };

  adder.match = function<K extends keyof T>(
    key: K,
    value: T[K],
    e: React.ReactElement<{className: string}>
  ) {
    (classesForMatches[key] = classesForMatches[key] || []).push([
      value,
      e.props.className,
    ]);
  };

  initializer(adder);

  return (props: T) => {
    if (props == null) return defaultStyle;
    let classNames = defaultStyle;

    let unusedInverseClasses = {...classesForInverseProps};

    let k: string;
    for (k in classesForProps) {
      let value = (props as any)[k];
      if (value) {
        classNames += " " + classesForProps[k];
        delete unusedInverseClasses[k];
      }
    }

    for (k in classesForProps) {
      let value = (props as any)[k];
      if (value) {
        classNames += " " + classesForProps[k];
        delete unusedInverseClasses[k];
      }
    }

    for (k in classesForMatches) {
      let value = (props as any)[k];
      let matches = classesForMatches[k];
      for (let match of matches) {
        if (match[0] !== value) continue;
        classNames += " " + match[1];
        break;
      }
    }

    for (k in unusedInverseClasses) {
      classNames += " " + unusedInverseClasses[k];
    }

    if (props.className && !ignoreGivenStyles)
      classNames += " " + props.className;

    return classNames;
  };
}
