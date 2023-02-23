import React from 'react';

export interface SentenceAnalyzerProps {
  language: string;
  sentence: string;
}

export function SentenceAnalyzer({
  language,
  sentence
}: SentenceAnalyzerProps) {
  switch (language) {
    case 'Japanese':
      return (
        <div>
          <a
            target="_blank"
            className="hover-light-blue blue mh1"
            href={`https://ichi.moe/cl/qr/?q=${encodeURIComponent(sentence)}`}
          >
            ichi.moe
          </a>
        </div>
      );
  }

  return <div />;
}
