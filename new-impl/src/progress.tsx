export interface Progress {
    bucket: string,
    message: string,
    delta: number,
}

export type WithProgress<T> = [T, Progress];

export function withProgress<T>(v: T, progress: Progress): WithProgress<T> {
    return [v, progress];
}