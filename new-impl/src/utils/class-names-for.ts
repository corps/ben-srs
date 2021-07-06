import React from "react";

export interface StyleAdder<T extends {className?: string}> {
  (
    k: keyof T & string,
    e: React.ReactElement<{className: string}>,
    inverse?: React.ReactElement<{className: string}>
  ): void;
}

export function classNamesGeneratorFor<T extends {}>(
  initializer: (add: StyleAdder<T>) => void,
  defaults: React.ReactElement<{className: string}> | null = null,
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

    if ('className' in props && !ignoreGivenStyles)
      classNames += " " + (props as any).className;

    return classNames;
  };
}
