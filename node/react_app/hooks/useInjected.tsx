import {createContext, PropsWithChildren, useContext, useState} from "react";
import {Tuple} from "../../shared/tuple";

type Injection = Tuple<any, any>;
const InjectionContext = createContext([] as Injection[]);

export function useInjected<T>(factory: () => T, d: () => T): T {
    const injections = useContext(InjectionContext);
    for (let [base, override] of injections) {
        if (base === factory) return override;
    }
    return d();
}

export function provide<T>(factory: () => T, override: T) {
    return Tuple.from(factory, override);
}

export function Inject({injections, children}: PropsWithChildren<{injections: Injection[]}>) {
    return <InjectionContext.Provider value={[...injections, ...useContext(InjectionContext)]}>
        {children}
    </InjectionContext.Provider>
}
