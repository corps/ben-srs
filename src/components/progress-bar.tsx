import * as React from "react";
import {clearInterval} from "timers";
import {classNamesGeneratorFor} from "../utils/class-names-for";

export interface ProgressBarProps {
  tasksNum: number
  tasksGroupId?: number | null
  green?: boolean
  red?: boolean
  blue?: boolean
}

const initialState = {
  progress: 0,
  maxTasks: 0,
};

const classNameGenerator = classNamesGeneratorFor<ProgressBarProps>(add => {
  add("tasksNum", <div className="o-100"/>, <div className="o-0"/>);
  add("green", <div className="bg-light-green"/>);
  add("red", <div className="bg-light-red"/>);
  add("blue", <div className="bg-light-blue"/>);
}, <div className="h-100 w-100 br2 br--right transition"/>);

export class ProgressBar extends React.Component<ProgressBarProps, typeof initialState> {
  state = initialState;
  handle: any;

  render() {
    let progress = this.state.progress;
    progress /= (progress + 2);

    if (this.state.maxTasks > 0) {
      progress = ((this.state.maxTasks - this.props.tasksNum) + progress) / this.state.maxTasks;
    } else {
      progress = 1;
    }

    progress *= 100;

    return <div className={classNameGenerator(this.props)} style={{width: progress + "%"}}>
    </div>;
  }

  componentDidMount() {
    this.handle = setInterval(() => {
      this.setState((prev) => {
        if (this.props.tasksNum == 0) return prev;
        if (prev.progress > 30) return prev;
        return {progress: prev.progress + 0.4, maxTasks: prev.maxTasks};
      });
    }, 200);
  }

  componentDidUpdate(prevProps: ProgressBarProps) {
    let prevNum = prevProps.tasksNum;
    let nextNum = this.props.tasksNum;
    const tasksNumChanged = prevNum !== nextNum;

    let prevTasksGroupId = prevProps.tasksGroupId;
    let tasksGroupId = this.props.tasksGroupId;
    const taskGroupIdChanged = prevTasksGroupId !== tasksGroupId;

    const resetMaxTasks = !nextNum || taskGroupIdChanged;

    if (tasksNumChanged || taskGroupIdChanged) {
      this.setState((prev) => {
        return {
          progress: 0,
          maxTasks: resetMaxTasks ? (nextNum || 0) : Math.max(prev.maxTasks, nextNum),
        };
      });
    }
  }

  componentWillUnmount() {
    clearInterval(this.handle);
  }
}
