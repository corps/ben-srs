import React from 'react';

export type Image =  {imageFilePath: string, url: string};

interface Props {
  images: Image[]
  onClick?: (imageFilePath: string) => void,
}

export function Images(props: Props) {
  const {images, onClick} = props;

  return <div className="pa3">
    <div className="cf">
      { images.map(({url, imageFilePath}) => <div className="fl w-50 w-25-m w-20-l pa2">
        <a href="#" className="db link dim tc" onClick={() => onClick && onClick(imageFilePath)}>
          <img src={url} className="w-100 db outline black-10"/>
        </a>
      </div>) }
    </div>
  </div>
}
