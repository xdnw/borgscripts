export function qSelector(selector: string): HTMLElement {
    return document.querySelector(selector) as HTMLElement;
}

export function qSelectorAll(selector: string): NodeListOf<HTMLElement> {
    return document.querySelectorAll(selector);
}

export function urlMatches(regex: RegExp): boolean {
    return regex.test(window.location.href);
}

export function refererMatches(regex: RegExp): boolean {
    return regex.test(document.referrer);
}

export function stringToHTML(str: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.body;
}

export function getQueryParam(param: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

export function addButton(text: string, onClick: () => void, parent?: HTMLElement): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    if (parent) {
        parent.appendChild(button);
    }
    return button;
}

export function createElement(tag: string, attributes: { [key: string]: string }, parent?: HTMLElement, classes?: string[]): HTMLElement {
    const element = document.createElement(tag);
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    if (classes) {
        element.classList.add(...classes);
    }
    if (parent) {
        parent.appendChild(element);
    }
    return element;
}

export function addCheckboxWithGMVariable(
    gmVariable: string,
    labelText: string,
    onToggle: (checked: boolean) => void,
    onInitialValue: (checked: boolean) => void,
    parentOrSibling?: HTMLElement,
    asSibling?: boolean
) {
    const initialValue = GM_getValue(gmVariable, false);
    // Run the function based on the initial value
    onInitialValue(initialValue);

    // Create the container div
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.cursor = 'pointer';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '3px';
    container.style.padding = '4px';
    container.style.backgroundColor = GM_getValue(gmVariable, false) ? 'green' : 'red';

    // Create the status span
    const statusSpan = document.createElement('span');
    statusSpan.textContent = GM_getValue(gmVariable, false) ? 'True' : 'False';
    statusSpan.style.marginRight = '8px';
    statusSpan.style.fontWeight = 'bold';

    // Create the checkbox input
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checkbox-${gmVariable}`;
    checkbox.checked = initialValue;
    checkbox.style.display = 'none'; // Hide the actual checkbox

    // Create the label
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = `${labelText} ${checkbox.checked ? 'Enabled' : 'Disabled'}`;
    label.style.flexGrow = '1';
    label.style.backgroundColor = '#f8f9fa'; // Bootstrap bg-light
    label.style.padding = '4px';
    label.style.margin = '0';

    // Append the status span, checkbox, and label to the container
    container.appendChild(statusSpan);
    container.appendChild(checkbox);
    container.appendChild(label);

    // Append the container to the parent or body
    if (parentOrSibling) {
        if (asSibling) {
            parentOrSibling.insertAdjacentElement('afterend', container);
        } else {
            parentOrSibling.appendChild(container);
        }
    } else {
        document.body.appendChild(container);
    }

    // Set up the event listener for the container
    container.addEventListener('click', () => {
        checkbox.checked = !checkbox.checked;
        GM_setValue(gmVariable, checkbox.checked);
        container.style.backgroundColor = checkbox.checked ? 'green' : 'red';
        statusSpan.textContent = checkbox.checked ? 'True' : 'False';
        label.textContent = `${labelText} ${checkbox.checked ? 'Enabled' : 'Disabled'}`;
        onToggle(checkbox.checked);
    });
}

const si = [
    { value: 1E18, symbol: "E" },
    { value: 1E15, symbol: "P" },
    { value: 1E12, symbol: "T" },
    { value: 1E9, symbol: "B" },
    { value: 1E6, symbol: "M" },
    { value: 1E3, symbol: "k" }
];
export function formatSi(num: number, fixed: number = 2): string {
    if (num === undefined) return num;
    const isNegative = num < 0;
    num = Math.abs(num);

    for (let i = 0; i < si.length; i++) {
        if (num >= si[i].value) {
            const formattedNum = num / si[i].value;
            const result = (formattedNum % 1 === 0 ? formattedNum.toString() : formattedNum.toFixed(fixed)) + si[i].symbol;
            return isNegative ? '-' + result : result;
        }
    }

    const result = (num % 1 === 0 ? num.toString() : num.toFixed(2));
    return isNegative ? '-' + result : result;
}

export function span(text: string, images?: string[]) {
    const span = document.createElement('span');
    span.classList.add('text-xs', 'rounded', 'text-white', 'px-2');
    span.style.backgroundColor = "rgba(0,0,0,0.5)";
    span.style.marginLeft = "1px";
    span.textContent = text;
    if (images) {
        images.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.style.width = '16px';
            img.style.height = '16px';
            img.style.marginLeft = '1px';
            span.appendChild(img);
        });
    }
    return span;
}

export async function get(url: string): Promise<Document> {
    while (true) {
        const response = await fetch(url, { method: 'GET', credentials: 'same-origin' });
        if (!/https:\/\/(test\.)?politicsandwar\.com\/human\//.test(response.url)) {
            const text = await response.text();
            return new DOMParser().parseFromString(text, "text/html");
        }
        window.open(response.url, '_blank');
        alert("Please complete the captcha in the new tab, then try again.");
    }
}

export async function post(url: string, data: URLSearchParams): Promise<Document> {
    console.log(url, data);
    while (true) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data.toString(),
            credentials: 'same-origin'
        });
        if (!/https:\/\/(test\.)?politicsandwar\.com\/human\//.test(response.url)) {
            const text = await response.text();
            return new DOMParser().parseFromString(text, "text/html");
        }
        window.open(response.url, '_blank');
        alert("Please complete the captcha in the new tab, then try again.");
    }
}

export function createElementText(tag: string, classes: string[], textContent?: string): HTMLElement {
    const element = document.createElement(tag);
    element.classList.add(...classes);
    if (textContent) {
        element.textContent = textContent;
    }
    return element;
}

export function replaceTextWithoutRemovingChildren(element: HTMLElement, newText: string) {
    // Iterate over all child nodes to find the text node
    let replaced = false;
    for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (child.nodeType === Node.TEXT_NODE && child.textContent) {
            child.textContent = newText;
            newText = "";
            replaced = true;
        }
    }
    if (!replaced) {
        const newTextNode = document.createTextNode(newText);
        element.insertBefore(newTextNode, element.firstChild);
    }
}
