export function delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function never() {
    return new Promise<void>(() => null);
}