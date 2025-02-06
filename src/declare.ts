import {getWarUrl} from "./pw-util";

function resetAutoCaptcha() {
    const captchaOriginalValue = GM_getValue('captchaAutofillEnabled_original', undefined)
    if (captchaOriginalValue !== undefined) {
        GM_setValue('captchaAutofillEnabled', captchaOriginalValue);
    } else {
        GM_deleteValue('captchaAutofillEnabled');
    }
    GM_deleteValue('captchaAutofillEnabled_original');
}

export function handleWarType() {
    const id =  parseInt((window.location.href.match(/politicsandwar\.com\/nation\/war\/declare\/id=(\d+)/) || [])[1]);
    const bulkDeclareStr = GM_getValue('bulkDeclare') as string;
    let bulkDeclare = bulkDeclareStr ? JSON.parse(bulkDeclareStr) as { ids: number[], type: string, reason: string, date: number } : undefined;
    if (bulkDeclare && bulkDeclare.ids.includes(id)) {
        bulkDeclare = {
            ids: bulkDeclare.ids.filter((i: number) => i !== id),
            type: bulkDeclare.type,
            reason: bulkDeclare.reason,
            date: Date.now(),
        }
        GM_setValue('bulkDeclare', JSON.stringify(bulkDeclare));
    }
    let shouldRedirectValue = shouldRedirect();
    if (shouldRedirectValue !== 0) {
        if (bulkDeclare) {
            if (bulkDeclare.date > Date.now() - 1000 * 60 * 5) {
                if (bulkDeclare.ids.length === 0) {
                    GM_deleteValue('bulkDeclare');
                    resetAutoCaptcha();
                    shouldRedirectValue = 1;
                } else {
                    const nextId = bulkDeclare.ids[0];
                    window.location.href = getWarUrl(nextId, bulkDeclare.type, bulkDeclare.reason);
                    return;
                }
            } else {
                GM_deleteValue('bulkDeclare');
                resetAutoCaptcha();
            }
        }
        if (shouldRedirectValue === 1) {
            window.location.href = '/nation/war/';
        }
        return;
    }

    const warTypeMap: { [key: string]: string } = {
        'ordinary': 'ord',
        'ord': 'ord',
        'attrition': 'att',
        'att': 'att',
        'raid': 'raid',
    };

    const urlParams = new URLSearchParams(window.location.search);

    const reason = urlParams.get('reason') as string;
    if (reason) {
        const decodedReason = decodeURIComponent(reason);
        const reasonInput = document.getElementById('reason') as HTMLInputElement;
        if (reasonInput) {
            reasonInput.value = decodedReason;
        }
    }

    let warType = urlParams.get('type') as string;
    const gmVariable = 'defaultWarType'; // Replace with actual GM variable
    let defaultWarType = GM_getValue(gmVariable, 'ord'); // Replace 'ord' with your default value
    if (!warType) {
        warType = defaultWarType;
    } else {
        warType = warTypeMap[warType] || defaultWarType;
    }
    const warTypeSelect = document.getElementById('war_type') as HTMLSelectElement;
    if (!warTypeSelect) return;

    if (warType && warTypeMap[warType]) {
        warTypeSelect.value = warTypeMap[warType];
    }

    const button = document.createElement('button');
    button.textContent = 'Set Default War Type';
    button.className = 'pw-btn pw-btn-text-white pw-btn-red';
    button.addEventListener('click', (event) => {
        event.preventDefault();
        defaultWarType = warTypeSelect.value;
        GM_setValue(gmVariable, warTypeSelect.value);
        updateButtonVisibility();
    });

    const warParamInfo = document.createElement('p');
    warParamInfo.innerHTML = 'Append e.g. <kbd>?type=raid</kbd> to the URL to pre-select the war type';
    warTypeSelect.insertAdjacentElement('afterend', warParamInfo);
    warTypeSelect.insertAdjacentElement('afterend', button);

    function updateButtonVisibility() {
        button.style.display = warTypeSelect!.value !== defaultWarType ? 'block' : 'none';
    }

    warTypeSelect.addEventListener('change', updateButtonVisibility);
    updateButtonVisibility(); // Initial check on page load
}

function shouldRedirect(): number {
    let alertElements = document.querySelectorAll('.pw-alert.pw-alert-green.block');
    for (const element of alertElements) {
        const text = element.textContent;
        if (text && text.includes('You have declared war on')) {
            return 1;
        }
    }
    alertElements = document.querySelectorAll('.pw-alert.pw-alert-red');
    for (const element of alertElements) {
        const text = element.textContent;
        if (text && (
            text.includes('You have already been involved in a war with this nation in the last 12 turns.') ||
            text.includes('You can\'t declare war on this nation because they are outside of your war range.') ||
            text.includes('You do not have any offensive war slots available')
        )) {
            return 2;
        }
    }
    return 0;
}