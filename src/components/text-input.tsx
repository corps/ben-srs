import * as React from "react";

export class TextInput extends React.Component<React.HTMLProps<HTMLInputElement>, {}> {
  lastPropValue = undefined as string;
  inputRef: HTMLInputElement;

  render() {
    let props = this.props;
    props = {...props, type: "text", ref: this.setRef};
    delete (props as any)["value"];

    return <input {...props}/>
  }

  setRef = (e: HTMLInputElement) => {
    this.inputRef = e;
  };

  componentDidMount() {
    if (this.inputRef) this.inputRef.value = this.props.value as string;
  }

  componentWillReceiveProps(nextProps: any) {
    if ("value" in nextProps && nextProps.value !== this.lastPropValue) {
      if (this.inputRef) {
        this.inputRef.value = nextProps.value;
      }
    }

    this.lastPropValue = nextProps.value as string;
  }
}