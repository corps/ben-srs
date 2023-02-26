import React, { useMemo, useState } from 'react';
import { useToggle } from '../hooks/useToggle';
import { Maybe, some } from '../../shared/maybe';

export type Image = { imageFilePath: string; url: string };

interface Props {
  images: Image[];
  onClick?: (image: Image) => void;
}

export function Images(props: Props) {
  const { images, onClick } = props;

  const [focusImage, setFocusImage] = useState<Maybe<string>>(null);
  if (focusImage) {
    return (
      <div className="pa3">
        <a href="#" className="link" onClick={() => setFocusImage(null)}>
          <img src={focusImage[0]} className="outline black-10 w-100" />
        </a>
      </div>
    );
  }

  return (
    <div className="pa3">
      <div className="cf">
        {images.map((img) => (
          <div className="fl w-50 w-25-m w-20-l pa2">
            <a
              href="#"
              className="db link dim tc"
              onClick={() =>
                onClick ? onClick(img) : setFocusImage(some(img.url))
              }
            >
              <img src={img.url} className="w-100 db outline black-10" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
