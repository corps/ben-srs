import * as React from "react";

export class TextArea extends React.Component<React.HTMLProps<HTMLTextAreaElement>, {}> {
  lastPropValue = undefined as string;
  inputRef: HTMLTextAreaElement;

  render() {
    let props = this.props;
    props = {...props, ref: this.setRef};
    delete (props as any)["value"];

    return <textarea {...props}/>
  }

  setRef = (e: HTMLTextAreaElement) => {
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
