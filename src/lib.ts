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

export function createElement(tag: string, attributes: { [key: string]: string }, parent?: HTMLElement): HTMLElement {
    const element = document.createElement(tag);
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
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