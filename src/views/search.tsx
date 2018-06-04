import {Action} from "../reducer";
import {Inputs, SearchResult, State} from "../state";
import * as React from "react";
import {SimpleNavLink} from "../components/simple-nav-link";
import {visitMainMenu} from "../reducers/main-menu-reducer";
import {DebouncingTextInput} from "../components/debouncing-inputs";
import {inputChange, inputChangeDispatcher} from "kamo-reducers/reducers/inputs";
import {SelectSingle} from "../components/select-single";
import {Note} from "../model";
import {StudyDetails} from "../study";
import {pageSearch, selectSearchResult} from "../reducers/search-reducer";

export function searchContent(dispatch: (action: Action) => void) {
  return (state: State) => {
    return (<div className="mw6 center">
        <div className="tc">
          <SimpleNavLink onClick={() => dispatch(visitMainMenu)}>
            戻る
          </SimpleNavLink>
          {state.searchPage > 0 &&
          <SimpleNavLink onClick={() => dispatch(pageSearch(-1))}>
            前
          </SimpleNavLink>}
          {state.searchHasMore &&
          <SimpleNavLink onClick={() => dispatch(pageSearch(1))}>
            次
          </SimpleNavLink>}
        </div>

        <div className="lh-copy f4 mt3">
          <div>
            検索モード:
            <div className="w-100">
              <SelectSingle
                values={["term", "term-new", "content", "note"]}
                onChange={(mode) => dispatch(inputChange<Inputs>("searchMode", mode))}
                value={state.inputs.searchMode.value}
                className="w-100"
              />
            </div>
          </div>
          <div>
            検索キーワード:
            <div className="w-100">
              <DebouncingTextInput
                onChange={inputChangeDispatcher(dispatch, "searchBar")}
                valueObject={state.inputs.searchBar}
                className="w-100"
              />
            </div>
          </div>
        </div>

        <div className="mt3">
          {state.searchResults.map(result =>
            <div
              onClick={() => dispatch(selectSearchResult(result))}
              className="break-word truncate pv1 ph2 mv2 bl bb pointer b--light-gray">
              {SearchResultRow(result, dispatch)}
            </div>)}
        </div>
      </div>
    );
  }
}

function SearchResultRow(result: SearchResult, dispatch: (action: Action) => void) {
  if (result[0] === "note") {
    let note = result[1] as Note;
    return <span>
      {note.attributes.content}
    </span>;
  } else {
    let details = result[1] as StudyDetails;
    return <span>
      <span>{details.beforeTerm}</span>
      <span className="fw5">
        {details.beforeCloze}
        {details.clozed}
        {details.afterCloze}
      </span>
      <span>{details.afterTerm}</span>
    </span>
  }
}
