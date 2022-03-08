import React from 'react'

export interface DictionaryLookupProps {
  language: string,
  word: string
}

export function DictionaryLookup({language, word}: DictionaryLookupProps) {
  switch (language) {
    case "Cantonese":
      return <div>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://www.cantonese.sheik.co.uk/dictionary/search/?searchtype=1&text=${word}`}>
          CantoD
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://cantonese.org/search.php?q=${word}`}>
          CC-Canto
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://glosbe.com/ja/yue/${word}`}>
          Glosbe
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://www.reddit.com/r/Cantonese/search/?restrict_sr=1&sr_nsfw=&q=${word}`}>
          r/Cantonese
        </a>
      </div>;

    default:
    case "English":
      return <div>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://ejje.weblio.jp/content/${word}`}>
          weblio
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://www.sanseido.biz/User/Dic/Index.aspx?TWords=${word}&st=0&DORDER=161517&DailyEJ=checkbox`}>
          sansei
        </a>
      </div>

    case "Japanese":
      return <div>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://dictionary.goo.ne.jp/srch/all/${word}/m0u/`}>
          goo
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={"http://jisho.org/search/" + word}>Jisho</a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://eow.alc.co.jp/search?q=${word}&ref=sa`}>
          Alc
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`http://dictionary.goo.ne.jp/srch/all/${word}/m0u/`}>
          Yahoo
        </a>
        <a target="_blank"
           className="hover-light-blue blue mh1"
           href={`https://www.google.co.jp/?q=${word}とは`}>
          Google
        </a>
      </div>;
  }
}
