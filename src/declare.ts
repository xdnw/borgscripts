export function handleWarType() {
    const warTypeMap: { [key: string]: string } = {
        'ordinary': 'ord',
        'ord': 'ord',
        'attrition': 'att',
        'att': 'att',
        'raid': 'raid',
    };

    const urlParams = new URLSearchParams(window.location.search);
    let warType = urlParams.get('type');
    const gmVariable = 'defaultWarType'; // Replace with actual GM variable
    let defaultWarType = GM_getValue(gmVariable, 'ord'); // Replace 'ord' with your default value
    if (!warType) {
        warType = defaultWarType;
    } else {
        warType = warTypeMap[warType] || defaultWarType;
    }
    const warTypeSelect = document.getElementById('war_type') as HTMLSelectElement | null;
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

export function handleRedirect() {
    const alertElements = document.querySelectorAll('.pw-alert.pw-alert-green.block');
    alertElements.forEach(element => {
        if (element.textContent && element.textContent.includes('You have declared war on')) {
            // Redirect to the specified URL
            window.location.href = '/nation/war/';
        }
    });
}