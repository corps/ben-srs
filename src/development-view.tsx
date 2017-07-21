import {Action} from "./reducer";
import {State} from "./state";
import {PageLayout} from "./components/page-layout";
import * as React from "react";
import {NavigationItem} from "./components/navigation-item";

export function developmentView(dispatch: (action: Action) => void) {

  const SimpleNav = <div>
    <NavigationItem red>
      Test item
    </NavigationItem>
    <NavigationItem red>
      More here
    </NavigationItem>
    <NavigationItem red>
      And here
    </NavigationItem>
    <NavigationItem red>
      And so on
    </NavigationItem>
  </div>;

  return (state: State) => {
    return <PageLayout nav={SimpleNav}>
      This would be some content on the page or something.
    </PageLayout>
  }
}
