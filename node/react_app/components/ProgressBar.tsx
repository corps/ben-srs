import React, { useEffect, useState } from 'react';
import { classNamesGeneratorFor } from '../utils/class-names-for';

interface Props {
  pendingNum: number;
  completed: number;
  green?: boolean;
  red?: boolean;
  blue?: boolean;
}

const classNameGenerator = classNamesGeneratorFor<Props>((add) => {
  add('completed', <div className="o-100" />, <div className="o-0" />);
  add('green', <div className="bg-light-green" />);
  add('red', <div className="bg-light-red" />);
  add('blue', <div className="bg-light-blue" />);
}, <div className="h-100 w-100 br2 br--right" />);

export function ProgressBar(props: Props) {
  const [tween, setTween] = useState(0);
  const { pendingNum, completed } = props;
  const tweened = tween / (tween + 2);
  const total = pendingNum + completed;

  const progress =
    pendingNum === 0 ? 100 : ((completed + tweened) / total) * 100;

  useEffect(() => {
    setTween(0);
    const interval = setInterval(
      () => setTween((t) => Math.min(t + 1, 30)),
      100
    );
    return () => clearInterval(interval);
  }, [completed]);

  return (
    <div
      className={classNameGenerator(props)}
      style={{ width: progress + '%', transition: 'all 250ms ease-in' }}
    ></div>
  );
}
