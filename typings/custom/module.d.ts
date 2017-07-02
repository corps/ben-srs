declare interface NodeModule {
  hot: {
    accept: () => void;
    dispose: (callback: () => void) => void;
  } | null;
}
