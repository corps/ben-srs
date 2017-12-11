import * as React from "react";

const debouncingTimeMs = 300;

type ValueObject = {value: string};

function getValueObject(p: {
  value?: any;
  valueObject: ValueObject;
}): ValueObject {
  if (p.valueObject) return p.valueObject;
  return {value: p.value as string};
}

class DebouncingInputBase<
  T extends HTMLInputElement | HTMLTextAreaElement
> extends React.Component<React.HTMLProps<T> & {valueObject: ValueObject}, {}> {
  debouncingTimeout: any = null;
  lastPropValue = undefined as ValueObject;
  lastValue = undefined as ValueObject;
  inputRef: T;
  debouncingChangeEvent: React.FormEvent<any>;

  private isDebouncing() {
    return !!this.debouncingTimeout;
  }

  private clearDebounce() {
    clearTimeout(this.debouncingTimeout);
    this.debouncingChangeEvent = null;
    this.debouncingTimeout = null;
  }

  private flush = () => {
    let e = this.debouncingChangeEvent;
    if (!e) return;
    this.clearDebounce();

    if (this.inputRef && this.props.onChange) {
      this.props.onChange(e);
    }
  };

  private onBlur = (e: any) => {
    this.flush();
    if (this.props.onBlur) this.props.onBlur(e);
  };

  private onChange = (e: React.FormEvent<any>) => {
    clearTimeout(this.debouncingTimeout);
    let lastValue = this.lastValue;
    this.lastValue = {value: (e.target as any).value as string};

    this.debouncingChangeEvent = e;

    if (!lastValue || !!this.lastValue.value != !!lastValue.value) {
      this.flush();
      return;
    }

    e.persist(); // See react event pooling.
    this.debouncingTimeout = setTimeout(this.flush, debouncingTimeMs);
  };

  render() {
    let props = this.props;
    props = {
      ...props,
      onBlur: this.onBlur,
      onChange: this.onChange,
      ref: this.setRef,
    };
    delete (props as any)["value"];
    delete (props as any)["valueObject"];

    return this.renderInner(props);
  }

  protected renderInner(props: React.HTMLProps<T>): JSX.Element {
    throw new Error("implement this is in subclasses");
  }

  setRef = (e: T) => {
    this.inputRef = e;
  };

  componentDidMount() {
    let vo = getValueObject(this.props);
    if (this.inputRef) this.inputRef.value = vo.value;
    this.lastValue = vo;
  }

  componentWillReceiveProps(
    nextProps: React.HTMLProps<T> & {valueObject: ValueObject}
  ) {
    let nextVo = getValueObject(nextProps);

    if (this.inputRef) {
      if (!this.isDebouncing()) {
        this.inputRef.value = nextVo.value;
        this.lastValue = nextVo;
      } else if (
        ("value" in nextProps || "valueObject" in nextProps) &&
        nextVo !== this.lastPropValue
      ) {
        this.inputRef.value = nextVo.value;
        this.lastValue = nextVo;
        this.clearDebounce();
      }
    }

    this.lastPropValue = nextVo;
  }
}

export class DebouncingTextInput extends DebouncingInputBase<HTMLInputElement> {
  renderInner(props: React.HTMLProps<HTMLInputElement>) {
    props = {type: "text", ...props};
    return <input {...props} />;
  }
}

export class DebouncingTextArea extends DebouncingInputBase<
  HTMLTextAreaElement
> {
  renderInner(props: React.HTMLProps<HTMLTextAreaElement>) {
    return <textarea {...props} />;
  }
}
