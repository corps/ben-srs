type NoInfer<A> = A & {[K in keyof T]: T[K]}