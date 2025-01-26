export function qSelector(selector: string): HTMLElement {
    return document.querySelector(selector) as HTMLElement;
}

export function qSelectorAll(selector: string): NodeListOf<HTMLElement> {
    return document.querySelectorAll(selector);
}

export function urlMatches(regex: RegExp): boolean {
    return regex.test(window.location.href);
}