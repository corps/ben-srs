import * as React from "react";
import {clearInterval} from "timers";
import {classNamesGeneratorFor} from "../utils/class-names-for";

export interface ProgressBarProps {
  tasksNum: number
}

const initialState = {
  progress: 0
};

const classNameGenerator = classNamesGeneratorFor<ProgressBarProps>(add => {
  add("tasksNum", <div className="o-100"/>, <div className="o-0"/>);
}, <div className="h-100 w-100 br2 br--right bg-light-red transition"/>);

export class ProgressBar extends React.Component<ProgressBarProps, typeof initialState> {
  state = initialState;
  handle: any;

  render() {
    let progress = this.state.progress;

    let percentage = this.props.tasksNum ? Math.floor(progress / (progress + 2) * 100 / this.props.tasksNum) : 100;

    return <div className={classNameGenerator(this.props)} style={{width: percentage + "%"}}>
    </div>;
  }

  componentDidMount() {
    this.handle = setInterval(() => {
      this.setState((prev) => {
        return {progress: prev.progress + 0.4};
      });
    }, 200);
  }

  componentWillUnmount() {
    clearInterval(this.handle);
  }
}
