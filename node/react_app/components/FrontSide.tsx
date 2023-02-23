import React, { useCallback, useEffect, useRef, MouseEvent } from 'react';
import { StudyDetails } from '../study';

interface Props {
  studyDetails: StudyDetails;
  readCard: () => void;
}

export function FrontSide(props: Props) {
  const { studyDetails } = props;

  return (
    <div className="tc ph3 mw6 center lh-copy">
      {(function () {
        switch (studyDetails.type) {
          case 'produce':
            return <Produce {...props} />;

          case 'speak':
            return <Speak {...props} />;

          case 'listen':
            return <Listen {...props} />;

          case 'recognize':
            return <Recognize {...props} />;

          case 'flash':
            return <Flash {...props} />;
        }

        return null;
      })()}
    </div>
  );
}

function Recognize({ studyDetails }: Props) {
  return (
    <div>
      <span>{studyDetails.beforeTerm}</span>
      <span className="br2 pa1 bg-light-yellow fw9">
        {studyDetails.beforeCloze}
        {studyDetails.clozed}
        {studyDetails.afterCloze}
      </span>
      <span>{studyDetails.afterTerm}</span>
    </div>
  );
}

function Flash({ studyDetails }: Props) {
  return <div>{studyDetails.definition}</div>;
}

function Listen({ studyDetails, readCard }: Props) {
  return (
    <div>
      <div className="f5 i mb3">{studyDetails.hint}</div>

      <div>
        <button className="ml3 br2 f4" onClick={readCard}>
          読み上げ
        </button>
      </div>
    </div>
  );
}

function Speak({ studyDetails }: Props) {
  return (
    <div>
      <div className="f5 i mb3">{studyDetails.hint}</div>

      <span>{studyDetails.beforeTerm}</span>
      <span className="br2 pa1 bg-light-yellow fw9">
        <span className="">
          {studyDetails.beforeCloze}
          {studyDetails.clozed}
          {studyDetails.afterCloze}
        </span>
      </span>
      <span>{studyDetails.afterTerm}</span>
    </div>
  );
}

function Produce({ studyDetails }: Props) {
  const blockClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div>
      <div className="f5 i mb3">{studyDetails.hint}</div>

      <span>{studyDetails.beforeTerm}</span>
      <span className="br2 pa1 bg-light-yellow fw9">
        <span className="">{studyDetails.beforeCloze}</span>
        <span className="ph3 pv1 br2 bb">?</span>
        <span className="">{studyDetails.afterCloze}</span>
      </span>
      <span>{studyDetails.afterTerm}</span>
      <div className="fixed bottom-0 w-100">
        <textarea onClick={blockClick} rows={3} className="w-100" />
      </div>
    </div>
  );
}
