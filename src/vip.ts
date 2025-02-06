import {delay, get, handleButtonClick, HR, post, qSelector, span} from "./lib";

export function addBulkPurchase() {
    addButtons();
}

function addButtons() {
    const existingButton = document.querySelector('.bulk-purchase-button');
    if (existingButton) return;

    // Create a container for the inputs and button
    const container = document.createElement('div');
    container.classList.add('bulk-purchase-container');
    container.append(HR());

    // Create infra input
    const infraInput = document.createElement('input');
    infraInput.type = 'number';
    infraInput.min = '1';
    infraInput.max = '5000';
    infraInput.step = '1';
    infraInput.placeholder = 'Infra';
    infraInput.classList.add('bulk-purchase-input');
    container.appendChild(infraInput);

    // Create land input
    const landInput = document.createElement('input');
    landInput.type = 'number';
    landInput.min = '1';
    landInput.max = '10000';
    landInput.step = '1';
    landInput.placeholder = 'Land';
    landInput.classList.add('bulk-purchase-input');
    container.appendChild(landInput);

    // Create purchase button
    const purchaseButton = document.createElement('button');
    purchaseButton.textContent = 'Purchase Bulk';
    purchaseButton.classList.add('bulk-purchase-button', 'btn', 'btn-primary');
    container.appendChild(purchaseButton);

    container.append(document.createElement("br"));
    container.append("Infra and land up to the specified amount will be purchased for the selected cities (infra/land is never sold)");

    // Append the container to the right column center
    const cityCreateLink = document.querySelector('.fa-building')?.parentElement?.parentElement?.parentElement;
    if (cityCreateLink) {
        cityCreateLink.appendChild(container);
    }

    addCityCheckboxes();

    // Add click event listener to the purchase button
    purchaseButton.addEventListener('click', () => {
        const infraValue = parseInt(infraInput.value);
        const landValue = parseInt(landInput.value);
        if (isNaN(infraValue) && isNaN(landValue)) {
            alert('Please enter valid values for infra and land.');
            return;
        }
        const existing = parseInfraLand();
        const cityIds = Object.keys(existing)
            .filter(key => existing[parseInt(key)].selected)
            .map(key => parseInt(key));
        if (cityIds.length === 0) {
            alert('Please select at least one city to purchase infra and land.');
            return;
        }
        // pretty print
        if (confirm(`Confirm the following purchase\n\nInfra: ${infraValue}\nLand: ${landValue}\nCities: ${cityIds.join(', ')}\n# Cities: ${cityIds.length}`)) {
            handleButtonClick(purchaseButton, () => purchaseInfraLandBulk(cityIds, infraValue, landValue, existing), f => {
                alert("Done\n\n" + f);
                window.location.reload();
            });
        }
    });

}

function purchaseInfraLand(cityId: number, infra?: number, land?: number) {
    const url = window.location.origin + `/city/id=${cityId}`;
    const postData = new URLSearchParams();
    postData.append('infra', !infra || isNaN(infra) ? '' : "@" + infra);
    postData.append('land', !land || isNaN(land) ? '' : "@" + land);
    postData.append('submitcityform', 'Buy / Sell');
    return get(url).then(doc => {
        const token = doc.querySelector('input[name="token"]')?.getAttribute('value');
        if (token) {
            postData.append('token', token);
            return post(url, postData).then(doc => {
                let alert = doc.querySelector('.alert-success');
                if (!alert) alert = doc.querySelector('.alert-danger');
                return alert?.textContent?.trim() ?? 'No response';
            })
        }
    });
}

async function purchaseInfraLandBulk(cityIds: number[], infra?: number, land?: number, existing: {[key: number]: {infra: number, land: number, selected: boolean}} = {}) {
    let msg = '';
    for (const cityId of cityIds) {
        const infraUpTo = infra && existing[cityId].infra < infra ? infra : undefined;
        const landUpTo = land && existing[cityId].land < land ? land : undefined;
        if (infraUpTo === undefined && landUpTo === undefined) continue;
        const result = await purchaseInfraLand(cityId, infraUpTo, landUpTo);
        if (result) {
            msg += `City ${cityId}: ${result}\n`;
        }
        await delay(10);
    }
    return msg;
}

function addCityCheckboxes() {
    const nationTable = qSelector('.nationtable');
    if (!nationTable) return;

    const rows = nationTable.querySelectorAll('tr');
    if (rows.length <= 1) return;

    // Add header checkbox
    const headerCell = rows[0].querySelector('th');
    if (headerCell) {
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.checked = true;
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = nationTable.querySelectorAll('input[type="checkbox"].city-checkbox');
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = selectAllCheckbox.checked;
            });
        });
        headerCell.insertBefore(selectAllCheckbox, headerCell.firstChild);
    }

    // Add checkboxes to each row except the last one
    rows.forEach((row, index) => {
        if (index === 0 || index === rows.length - 1) return; // Skip header and footer rows
        const cell = row.querySelector('td');
        if (cell) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('city-checkbox');
            checkbox.checked = true;
            cell.insertBefore(checkbox, cell.firstChild);
        }
    });
}

function parseInfraLand(): {[key: number]: {infra: number, land: number, selected: boolean}} {
    const nationTable = qSelector('.nationtable');
    const result: {[key: number]: {infra: number, land: number, selected: boolean}} = {};
    if (!nationTable) {
        return result;
    }

    const rows = nationTable.querySelectorAll('tr');
    rows.forEach((row, index) => {
        if (index === 0 || index === rows.length - 1) return; // Skip header and footer rows
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return; // Ensure there are enough cells

        const cityId = parseInt(cells[0].querySelector('a')?.getAttribute('href')?.split('=')[1] ?? '0');
        const infra = parseFloat(cells[1].textContent?.trim().replace(',', '') ?? '0');
        const land = parseFloat(cells[2].textContent?.trim().replace(',', '') ?? '0');
        const checkbox = cells[0].querySelector('input[type="checkbox"].city-checkbox') as HTMLInputElement;
        const selected = checkbox ? checkbox.checked : false;

        if (!isNaN(cityId) && cityId > 0 && !isNaN(infra) && !isNaN(land)) {
            result[cityId] = {infra, land, selected};
        }
    });

    return result;
}