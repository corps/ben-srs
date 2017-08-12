import * as React from "react";
import {Language} from "../model";

export interface DictionaryLookupProps {
  language: Language,
  word: string
}

export function DictionaryLookup(props: DictionaryLookupProps) {
  switch (props.language) {
    case "Cantonese":
      return <div>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://www.cantonese.sheik.co.uk/dictionary/search/?searchtype=1&text=${props.word}`}>
          CantoD
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://glosbe.com/ja/yue/${props.word}`}>
          Glosbe
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://www.google.co.jp/?q=${props.word}とは`}>
          Google
        </a>
      </div>;

    default:
    case "English":
      return <div>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://ejje.weblio.jp/content/${props.word}`}>
          weblio
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://www.sanseido.biz/User/Dic/Index.aspx?TWords=${props.word}&st=0&DORDER=161517&DailyEJ=checkbox`}>
          sansei
        </a>
      </div>

    case "Japanese":
      return <div>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://www.sanseido.biz/User/Dic/Index.aspx?TWords=${props.word}&st=0&DailyJJ=checkbox&DailyEJ=checkbox&DailyJE=checkbox`}>
          Sansei
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={"http://jisho.org/search/" + props.word}>Jisho</a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://eow.alc.co.jp/search?q=${props.word}&ref=sa`}>
          Alc
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://dictionary.goo.ne.jp/srch/all/${props.word}/m0u/`}>
          Yahoo
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://www.google.co.jp/?q=${props.word}とは`}>
          Google
        </a>
      </div>;
  }
}
