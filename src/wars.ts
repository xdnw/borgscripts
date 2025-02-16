import $ from 'jquery';

import {
    Airstrike,
    AirstrikeTarget,
    AttackInfo,
    BattleDetails,
    extractBattleDetailsInferred, getMaxGroundStrength,
    getOdds, getOddsArr,
    getResources,
    getStatusHtml,
    getValidAttacks, getWarUrl,
    GroundAttack,
    groundStrength,
    MilitaryUnits,
    NavalAttack,
    Status, UNIT_PURCHASES, UnitPurchaseFormInfo
} from "./pw-util";
import {
    addCheckboxWithGMVariable,
    createElement,
    createElementText, delay,
    formatSi,
    get, HR,
    post,
    replaceTextWithoutRemovingChildren,
    span,
    VR,
    handleButtonClick
} from "./lib";
import {getOrFetchProjectsForAll, PROJECT_BITS} from "./projects";

export function initWarsPage() {
    const url = "/index.php?id=15&amp;keyword=1725.26&amp;cat=war_range&amp;ob=score&amp;od=ASC&amp;maximum=15&amp;minimum=0&amp;search=Go&amp;beige=true&amp;vmode=false&amp;openslots=true";
    removeElems();
    initMyUnits();
}

function getFinalBody() {
    const tailwindBodies = document.querySelectorAll('#tailwind-body');
    if (!tailwindBodies) {
        console.log("Tailwind body not found");
        return document.body;
    }
    return tailwindBodies[tailwindBodies.length - 1];
}

function removeElems() {
    const tailwindBody = getFinalBody();
    const tagsToRemove: { [key: string]: number } = { 'DIV': 1, 'P': 2, 'IMG': 1, 'HR': 1 };
    Array.from(tailwindBody.children).forEach(child => {
        const tag = child.tagName as keyof typeof tagsToRemove;
        if (tagsToRemove[tag] > 0) {
            tailwindBody.removeChild(child);
            tagsToRemove[tag]--;
        }
    });
    const header = document.getElementById('header');
    if (header) header.innerHTML = '';

    // alert div, with fixed height, as second child of tailwindBody
    const alertDiv = document.createElement('div');
    alertDiv.id = 'alert-div';
    alertDiv.style.height = '120px';
    alertDiv.style.overflow = 'auto';
    alertDiv.innerHTML = 'Alerts will appear here...';
    alertDiv.classList.add('border', 'border-gray-300', 'rounded', 'p-2', 'bg-gray-200');
    tailwindBody.insertBefore(alertDiv, tailwindBody.children[1]);
}

export type CardInfo = {
    element: Element;
    self: CardSide;
    other: CardSide;
    id: number;
    enemy_project_bits: number | undefined;
}

export type CardSide = MilitaryUnits & {
    name: string;
    nation_id: number;
    alliance_id: number;
    alliance_name: string;
    resistance: number;
    map: number;
    status: string[];
}

function parseUnits() {
    const cards: CardInfo[] = [];
    const elems = document.querySelectorAll('.pw-card');
    if (!elems) return cards;
    elems.forEach(card => {
        const warLink = card.querySelector('a[href^="/nation/war/timeline/war="]');
        if (!warLink) return;
        const warID = parseInt(warLink.getAttribute('href')!.split('=')[1]);
        const selfUnits = parseCardSide(card, false);
        const opponentUnits = parseCardSide(card, true);
        const bitsAndDate = GM_getValue(`projects_${opponentUnits.nation_id}`, undefined);
        cards.push({ element: card, self: selfUnits, other: opponentUnits, id: warID, enemy_project_bits: bitsAndDate ? bitsAndDate & 0xF : undefined });
    });
    return cards;
}

function parseCardSide(card: Element, side: boolean): CardSide {
    let nation_id = -1;
    let name = 'Unknown';
    let alliance_id = -1;
    let alliance_name = 'Unknown';
    let resistance = -1;
    let map = -1;
    let soldier = -1;
    let tank = -1;
    let aircraft = -1;
    let ship = -1;
    let missile = -1;
    let nuke = -1;
    let status: string[] = [];

    const o = side ? 1 : 0;
    const sideElements = card.querySelectorAll('.grid.grid-cols-2.gap-2');
    const hasStatus = sideElements.length === 17;
    const statusO = hasStatus ? 2 : 0;
    { // nation
        const natLink = sideElements[4].children[o];
        nation_id = parseInt(natLink.getAttribute('href')!.split('=')[1]);
        name = natLink.textContent!.trim();
    }
    { // alliance
        const allLink = sideElements[6].children[o];
        // if not A tag, then no alliance, set to 0 and None
        if (allLink.tagName === 'A') {
            alliance_id = parseInt(allLink.getAttribute('href')!.split('=')[1]);
            alliance_name = allLink.textContent!.trim();
        } else {
            alliance_id = 0;
            alliance_name = 'None';
        }
    }
    if (hasStatus) { // status
        const statusDiv = sideElements[8].children[o];
        let statusIcons = statusDiv.querySelectorAll('.pw-tooltip-content');
        if (statusIcons.length === 0) statusIcons = statusDiv.querySelectorAll('.text-xs');
        statusIcons.forEach(icon => {
            status.push(icon.textContent!.trim().toLowerCase());
        });
    }
    { // resistance
        const resDiv = sideElements[8 + statusO].children[o];
        const resText = resDiv.textContent!.trim();
        const [res, resMax] = resText.split('/');
        resistance = parseInt(res);
    }
    { // map
        const mapDiv = sideElements[10 + statusO].children[o];
        const mapText = mapDiv.textContent!.trim();
        const [mapCur, mapMax] = mapText.split('/');
        map = parseInt(mapCur);
    }
    { // units
        const unitDiv = sideElements[12 + statusO].children[o];
        const unitIcons = unitDiv.querySelectorAll('.pw-tooltip-content');
        soldier = parseInt(unitIcons[side ? 3 : 0].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        aircraft = parseInt(unitIcons[side ? 4 : 1].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        missile = parseInt(unitIcons[side ? 5 : 2].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        tank = parseInt(unitIcons[side ? 0 : 3].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        ship = parseInt(unitIcons[side ? 1 : 4].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        nuke = parseInt(unitIcons[side ? 2 : 5].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
    }

    return { name, nation_id, alliance_id, alliance_name, soldier, tank, aircraft, ship, missile, nuke, resistance, map, status };
}

function setCard(card: CardInfo, attack: AttackInfo | undefined, details: BattleDetails | undefined) {
    const selfStatusCopy = [...card.self.status];
    const otherStatusCopy = [...card.other.status];
    if (attack && details) {
        card.other.resistance = Math.max(card.other.resistance - details.resistance, 0);
        card.self.map = Math.max(card.self.map - attack.mapCost, 0);

        card.self.soldier! = Math.max(0, card.self.soldier! - (details.yourForces.soldiers ?? 0));
        card.self.tank! = Math.max(0, card.self.tank! - (details.yourForces.tanks ?? 0));
        card.self.aircraft! = Math.max(0, card.self.aircraft! - (details.yourForces.aircraft ?? 0));
        card.self.ship! = Math.max(0, card.self.ship! - (details.yourForces.ships ?? 0));

        card.other.soldier! = Math.max(0, card.other.soldier! - (details.opponentForces.soldiers ?? 0));
        card.other.tank! = Math.max(0, card.other.tank! - (details.opponentForces.tanks ?? 0));
        card.other.aircraft! = Math.max(0, card.other.aircraft! - (details.opponentForces.aircraft ?? 0));
        card.other.ship! = Math.max(0, card.other.ship! - (details.opponentForces.ships ?? 0));

        if (details.success !== 0) {
            const it = details.success === 3;
            if (attack instanceof GroundAttack) {
                card.other.status = card.other.status.filter(status => status !== Status.GROUND_CONTROL);
                // add to card.self.status if not present
                if (it && !card.self.status.includes(Status.GROUND_CONTROL)) {
                    card.self.status.push(Status.GROUND_CONTROL);
                }
            } else if (attack instanceof Airstrike) {
                card.other.status = card.other.status.filter(status => status !== Status.AIR_SUPERIORITY);
                if (it && !card.self.status.includes(Status.AIR_SUPERIORITY)) {
                    card.self.status.push(Status.AIR_SUPERIORITY);
                }
            } else if (attack instanceof NavalAttack) {
                card.other.status = card.other.status.filter(status => status !== Status.NAVAL_BLOCKADING);
                if (it && !card.self.status.includes(Status.NAVAL_BLOCKADING)) {
                    card.self.status.push(Status.NAVAL_BLOCKADING);
                }
            }
        }
    }
    const hasStatusChanged = selfStatusCopy.length !== card.self.status.length || otherStatusCopy.length !== card.other.status.length || true;
    let sideElements = card.element.querySelectorAll('.grid.grid-cols-2.gap-2');

    if (hasStatusChanged) {
        const hasStatus = sideElements.length === 17;
        let selfIconsDiv: Element | null = null;
        let otherIconsDiv: Element | null = null;
        if ((card.self.status || card.other.status) && !hasStatus) {
            const div1 = createElementText('div', ['grid', 'grid-cols-2', 'gap-2', 'mt-0.5']);
            const p1 = createElementText('p', ['pw-title-xs']);
            p1.textContent = 'Statuses';
            const p2 = createElementText('p', ['pw-title-xs', 'float-right', 'text-right']);
            p2.textContent = "Opponent's Statuses";
            div1.appendChild(p1);
            div1.appendChild(p2);
        
            const div2 = createElementText('div', ['grid', 'grid-cols-2', 'gap-2', 'mt-0.5']);
            selfIconsDiv = createElementText('div', ['mr-auto', 'inline-flex', 'gap-0.5']);
            otherIconsDiv = createElementText('div', ['ml-auto', 'inline-flex', 'gap-0.5', 'flex-row-reverse']);
            div2.appendChild(selfIconsDiv);
            div2.appendChild(otherIconsDiv);
        
            card.element.insertBefore(div1, card.element.children[8]);
            card.element.insertBefore(div2, card.element.children[9]);
        } else {
            selfIconsDiv = sideElements[8].children[0];
            otherIconsDiv = sideElements[8].children[1];
        }
        // clear self and other
        selfIconsDiv.innerHTML = '';
        otherIconsDiv.innerHTML = '';
        card.self.status.forEach(status => {
            const statusEnum = Status[status.toUpperCase().replace(' ', '_') as keyof typeof Status];
            selfIconsDiv.appendChild(span(getStatusHtml(statusEnum), undefined, true, false));
        });
        card.other.status.forEach(status => {
            const statusEnum = Status[status.toUpperCase().replace(' ', '_') as keyof typeof Status];
            otherIconsDiv.appendChild(span(getStatusHtml(statusEnum), undefined, true, false));
        });

        sideElements = card.element.querySelectorAll('.grid.grid-cols-2.gap-2');
    }

    const hasStatus = sideElements.length === 17;
    const statusO = hasStatus ? 2 : 0;
    { // Resistance
        const opponentResDiv = sideElements[8 + statusO].children[1];
        const resistanceValue = card.other.resistance; // Assuming this is the new resistance value
    
        // Find the existing progress bar and text elements
        const progressBarDiv = opponentResDiv.children[0] as HTMLElement;
        const textDiv = opponentResDiv.children[1] as HTMLElement;
    
        // Update the width of the progress bar
        if (progressBarDiv) {
            progressBarDiv.style.width = `${resistanceValue}%`;
        }
    
        // Update the text content
        if (textDiv) {
            textDiv.textContent = `${resistanceValue}/100`;
        }
    }
    { // self MAP
        const selfMapDiv = sideElements[10 + statusO].children[0];
        const mapValue = card.self.map; // Assuming this is the new map value
    
        // Find the existing progress bar and text elements
        const progressBarDiv = selfMapDiv.children[0] as HTMLElement;
        const textDiv = selfMapDiv.children[1] as HTMLElement;
    
        // Update the width of the progress bar
        if (progressBarDiv) {
            progressBarDiv.style.width = `${mapValue / 0.12}%`;
        }
    
        // Update the text content
        if (textDiv) {
            textDiv.textContent = `${mapValue}/12`;
        }
    }

    { // units
        const unitDivParent = sideElements[12 + statusO] as HTMLElement;
        updateUnits(unitDivParent, false, card.self);
        updateUnits(unitDivParent, true, card.other);
    }
}

function updateUnits(unitParentDiv: HTMLElement, side: boolean, info: CardSide) {
    const unitDiv = unitParentDiv.children[side ? 1 : 0];
    const unitIcons = unitDiv.querySelectorAll('.pw-tooltip');
    updateUnit(unitIcons[0], 'soldiers', info.soldier!);
    updateUnit(unitIcons[1], 'aircraft', info.aircraft!);
    updateUnit(unitIcons[2], 'missiles', info.missile!);
    updateUnit(unitIcons[3], 'tanks', info.tank!);
    updateUnit(unitIcons[4], 'ships', info.ship!);
    updateUnit(unitIcons[5], 'nukes', info.nuke!);
}

function updateUnit(unitDiv: Element, unit: string, value: number) {
    const unitSI = formatSi(value, 1);
    replaceTextWithoutRemovingChildren(unitDiv.children[0] as HTMLElement, unitSI);
    unitDiv.children[1].textContent = value + " " + unit;
}

function test(cards: CardInfo[]) {
    const dummyDetails: BattleDetails = {
        success: 3,
        resistance: 20,
        yourForces: { soldiers: -321321, tanks: -10000 },
        opponentForces: { soldiers: 500, tanks: 50 },
        munitions: 100,
        gasoline: 100,
        infrastructureDestroyed: 5,
    };
    const dummyAttack = new GroundAttack({}, false, [0, 0, 0, 1], 500, 500, true, true);
    setCard(cards[0], dummyAttack, dummyDetails);
    // setCard(cards[0], undefined, undefined);
}

function initMyUnits() {
    const cards: CardInfo[] = parseUnits();
    if (!cards) return;
    setAutoAndValidAttacks(cards);
}

function setAutoAndValidAttacks(cards: CardInfo[]) {
    const allAttacks: [CardInfo, AttackInfo[]][] = [];
    for (const card of cards) {
        const attacks = setValidAttacks(cards, card);
        allAttacks.push([card, attacks]);
    }
    addAutoAttack(cards, allAttacks);
    addRebuyButtons(cards);
}

function setValidAttacks(cards: CardInfo[], card: CardInfo) {
    const attacks = getValidAttacks(card);
    let attackDiv = document.getElementById("warcard-" + card.id);
    if (!attackDiv) {
        attackDiv = document.createElement('div');
        attackDiv.id = "warcard-" + card.id;
        card.element.appendChild(attackDiv);
    } else {
        attackDiv.innerHTML = ''; // Clear existing content
    }
    if (attacks) {
        attackDiv.appendChild(HR());
        const strong = document.createElement('strong');
        strong.textContent = 'Attacks';
        attackDiv.appendChild(strong);
    }
    for (const attack of attacks) {
        const btn = createAttackButton(cards, attack, card);
        attackDiv.appendChild(btn);
    }

    { // Enemy odds
        let enemyOdds = card.element.querySelector('.pw-card-odds');
        if (!enemyOdds) {
            enemyOdds = document.createElement('div');
            enemyOdds.classList.add('pw-card-odds');
            card.element.appendChild(enemyOdds);
        }
        // clear
        enemyOdds.innerHTML = '';
        enemyOdds.appendChild(HR());
        const strong = document.createElement('strong');
        strong.textContent = 'Enemy Odds';
        enemyOdds.appendChild(strong);
        const defGroundStr = getMaxGroundStrength(card.other, card.self, undefined);
        const selfGroundStr = getMaxGroundStrength(card.self, card.other, getResources());
        enemyOdds.appendChild(OddsComponent({ title: 'Ground', odds: getOddsArr(defGroundStr, selfGroundStr) }));
        enemyOdds.appendChild(OddsComponent({ title: 'Air', odds: getOddsArr(card.other.aircraft!, card.self.aircraft!) }));
        enemyOdds.appendChild(OddsComponent({ title: 'Naval', odds: getOddsArr(card.other.ship!, card.self.ship!) }));
    }
    setEnemyProjects(card);

    return attacks;
}
function setEnemyProjects(card: CardInfo) {
    let projectElem = card.element.querySelector('.pw-card-projects');
    if (!projectElem) {
        projectElem = document.createElement('div');
        projectElem.classList.add('pw-card-projects');
        card.element.appendChild(HR());
        card.element.appendChild(projectElem);
    }
    projectElem.innerHTML = '';
    if (card.enemy_project_bits === undefined) {
        projectElem.textContent = 'Projects are not fetched...';
    } else if (card.enemy_project_bits === 0) {
        projectElem.textContent = 'No projectile projects';
    } else {
        for (const [project, bit] of Object.entries(PROJECT_BITS)) {
            const hasProject = (card.enemy_project_bits ?? 0) & bit;
            if (hasProject) {
                projectElem.appendChild(span(project));
            }
        }
    }
}

function OddsComponent({ title, odds, label, text }: { title: string, odds: number[], label?: boolean, text?: boolean }) {
    const container = document.createElement('div');

    if (label === undefined || label) {
        const header = document.createElement('div');
        header.style.marginTop = '2px';
        header.textContent = `Odds ${title}`;
        header.classList.add('text-xs', 'font-bold');
        container.appendChild(header);
    }

    const flexDiv = document.createElement('div');
    flexDiv.className = 'flex w-full h-4 text-xs';
    container.appendChild(flexDiv);

    const calculatedOdds = [0, 1, 2, 3].map(success => ({
        success,
        odds: odds[success] * 100
    })).filter(({ odds }) => odds > 0);

    if (calculatedOdds.length === 0) {
        flexDiv.appendChild(OddsSuccess({ odds: 100, success: 0, text: text }) as HTMLElement);
    } else {
        calculatedOdds.forEach(({ success, odds }) => {
            if (odds > 0) flexDiv.appendChild(OddsSuccess({ odds, success, text }));
        });
    }

    return container;
}

function OddsSuccess({ odds, success, text }: { odds: number, success: number, text?: boolean }) {
    const successClasses = [
        'bg-red-600',
        'bg-orange-600',
        'bg-yellow-600',
        'bg-green-600'
    ];

    const div = document.createElement('div');
    div.className = `flex-grow ${successClasses[success]}`;
    div.style.width = `${odds}%`;
    div.setAttribute('aria-valuenow', odds.toString());
    div.setAttribute('aria-valuemin', '0');
    div.setAttribute('aria-valuemax', '100');

    if (text === undefined || text) {
        const innerDiv = document.createElement('div');
        innerDiv.className = 'whitespace-nowrap break-keep overflow-hidden';
        innerDiv.textContent = `${Math.round(odds)}% ${['Utter Failure', 'Pyrrhic Victory', 'Moderate Success', 'Immense Triumph'][success]}`;
        div.appendChild(innerDiv);
    }

    return div;
}

function addAutoAttack(cards: CardInfo[], attacks: [CardInfo, AttackInfo[]][] ) {
    const tailwindBody = getFinalBody();
    const centerDiv = tailwindBody.querySelector('.text-center');
    if (!centerDiv) {
        return;
    }
    const firstLink = centerDiv.querySelector("a");
    if (firstLink) {
        firstLink.children[0].className = '';
    }

    let first: [CardInfo, AttackInfo] | null = null;
    for (let [card, attackList] of attacks) {
        for (const attack of attackList) {
            if (attack.requirePrompt || attack.disabled || !attack.hasMap) continue;
            const maxVal = Math.max(...attack.odds);
            if (maxVal === attack.odds[3]) {
                first = [card, attack];
                break;
            }
        }
        if (first) break;
    }

    if (!first) {
        const existingBtn = document.getElementById('auto-attack');
        if (existingBtn) {
            existingBtn.remove();
        }
    } else {
        const [card, attack] = first;
        let autoBtn = document.getElementById('auto-attack') as HTMLButtonElement;
        if (!autoBtn) {
            centerDiv.appendChild(VR());
            autoBtn = document.createElement('button');
            autoBtn.classList.add('inline-flex', 'text-xl', 'items-center', 'mr-2', 'text-white', 'hover:text-gray-100', 'active:text-gray-200', 'focus:text-white', 'bg-red-600', 'hover:bg-red-700', 'active:bg-red-800', 'justify-center', 'rounded', 'py-2', 'px-3', 'typically:no-underline');
            autoBtn.id = 'auto-attack';
            autoBtn = centerDiv.appendChild(autoBtn);
        }
        autoBtn.textContent = `Attack ${card.other.name}: ${attack.toString()}`;
        autoBtn.onclick = () => executeAttack(cards, attack, autoBtn, card);
    }

    let infoBtn = document.getElementById('auto-attack-info') as HTMLButtonElement;
    if (!infoBtn) {
        infoBtn = document.createElement('button');
        infoBtn.id = 'auto-attack-info';
        infoBtn.textContent = 'ℹ️';
        infoBtn.classList.add('inline-flex', 'text-xl', 'items-center', 'mr-2', 'text-white', 'hover:text-gray-100', 'active:text-gray-200', 'focus:text-white', 'bg-blue-600', 'hover:bg-blue-700', 'active:bg-blue-800', 'justify-center', 'rounded', 'py-2', 'px-2', 'typically:no-underline');
        infoBtn.onclick = () => {
            alert('The first available Immense Triumph attack will be added as a button here, if it exists.');
        };
        centerDiv.appendChild(infoBtn);
    }

    // Declare bulk
    let bulkBtn = document.getElementById('bulk-declare') as HTMLButtonElement;
    if (!bulkBtn) {
        bulkBtn = document.createElement('button');
        bulkBtn.id = 'bulk-declare';
        bulkBtn.textContent = 'Declare Bulk';
        bulkBtn.classList.add('inline-flex', 'text-xl', 'items-center', 'mr-2', 'text-white', 'hover:text-gray-100', 'active:text-gray-200', 'focus:text-white', 'bg-green-600', 'hover:bg-green-700', 'active:bg-green-800', 'justify-center', 'rounded', 'py-2', 'px-3', 'typically:no-underline');
        bulkBtn.onclick = () => {
            declareBulk();
        };
        centerDiv.appendChild(VR());
        centerDiv.appendChild(bulkBtn);
    }
}

function declareBulk() {
    const dialog = $('<div></div>')
        .html(`
<form id="bulkDeclareForm">
    <div>
        <label for="urls">Nation Declare URLs (one per line):</label><br>
        <textarea id="urls" name="urls" rows="5" cols="55" required></textarea>
    </div>
    <div>
        <label for="warType">War Type:</label>
        <select id="warType" name="warType" required>
            <option value="raid">Raid</option>
            <option value="ordinary">Ordinary</option>
            <option value="attrition">Attrition</option>
        </select>
    </div>
    <div>
        <label for="reason">Reason:</label>
        <input type="text" id="reason" name="reason" maxlength="120" required value="counter">
    </div>
    <div>
        <button type="button" id="validateButton" class="btn btn-default">Validate</button>
        <button type="submit" class="btn btn-default">Submit</button>
    </div>
</form>
        `)
        .dialog({
            autoOpen: false,
            title: 'Declare Bulk War',
            width: 525,
            modal: true,
            buttons: {
                Close: function() {
                    $(this).dialog('close');
                }
            }
        });

    dialog.dialog('open');

    function validateUrls(): boolean {
        const urls = ($('#urls').val() as string).trim();
        if (!urls) {
            alert('Please enter some URLs.');
            return false;
        }
        const urlPattern = new RegExp(window.location.origin + "[^=]+id=[0-9]+");
        const isValid = urls.split('\n').every(url => urlPattern.test(url.trim()));
        if (isValid) {
            return true;
        } else {
            alert('Invalid URL(s) entered. Please provide valid urls in the form:\n' +
                window.location.origin + '/nation/id=123456');
            return false;
        }
    }

    $('#validateButton').on('click', function() {
        if (validateUrls()) alert('URLs are valid.');
    });

    $('#bulkDeclareForm').on('submit', function(event) {
        event.preventDefault();
        if (!validateUrls()) return;
        const ids: number[] = ($('#urls').val() as string).trim().split('\n').map(url => parseInt(url.split('=')[1]));
        const warType = ($('#warType').val() as string).toLowerCase();
        const reason = $('#reason').val() as string;
        const captchaOriginalValue = GM_getValue('captchaAutofillEnabled', undefined)
        if (captchaOriginalValue !== undefined) {
            GM_setValue('captchaAutofillEnabled_original', captchaOriginalValue);
        }
        GM_setValue('captchaAutofillEnabled', true);
        GM_setValue('bulkDeclare', JSON.stringify({ ids: ids, type: warType, reason: reason, date: Date.now() }));
        window.location.href = getWarUrl(ids[0], warType, reason);
    });
}

function createAttackButton(cards: CardInfo[], attack: AttackInfo, card: CardInfo) {
    const remapEndpoint: { [key: string]: string } = {
        groundbattle: 'ground',
        navalbattle: 'naval',
        airstrike: 'air',
    }
    const oddsLabels = ['UF', 'PV', 'MS', 'IT'];
    const oddsColors = ['red', 'orange', 'yellow', 'green'];

    const btnChild = OddsComponent({ title: '', odds: attack.odds, label: false, text: false });
    const btn = document.createElement('button');
    const spanOverlay = document.createElement('span');
    spanOverlay.appendChild(span(attack.toString(), undefined, false, false));

    btn.classList.add('hover-opacity', 'active-opacity', 'rounded', 'w-full')
    btn.style.overflow = 'hidden';
    btn.style.position = 'relative';
    if (!attack.hasMap || attack.disabled) {
        btn.disabled = true;
        btn.classList.add('text-gray-700');
        btn.style.cursor = 'not-allowed';
    }

    spanOverlay.style.position = 'absolute';
    spanOverlay.style.top = '0';
    spanOverlay.style.left = '0';
    spanOverlay.style.width = '100%';
    spanOverlay.style.height = '100%';
    spanOverlay.style.display = 'flex';
    spanOverlay.style.alignItems = 'center';
    spanOverlay.style.justifyContent = 'center';

    btn.appendChild(spanOverlay);
    btn.appendChild(btnChild);
    // btn.classList.add('inline-flex', 'text-xs', 'items-center', 'gap-0.5', 'justify-center', 'rounded', 'px-2', 'w-full'); // , `bg-${buttonBg}-600`, `hover:bg-${buttonBg}-700`, `active:bg-${buttonBg}-800`

    attack.odds.forEach((odd, index) => {
        if (odd >= 0.01) {
            const myspan = span(`${(odd * 100).toFixed(0)}% ${oddsLabels[index]}`);
            myspan.style.marginLeft = '4px';
            spanOverlay.appendChild(myspan);
        }
    });

    if (attack.low_rss) {
        btn.appendChild(span("low", ["https://politicsandwar.com/img/resources/munitions.png", "https://politicsandwar.com/img/resources/gasoline.png"]));
    }

    if (attack.hasMap) {
        btn.onclick = () => {
            if (attack.requirePrompt) {
                const successStr = attack.odds
                    .filter(odd => odd > 0)
                    .map((odd, index) => `${oddsLabels[index]}: ${(odd * 100).toFixed(0)}%`)
                    .join(', ');
                const userConfirmed = confirm("Are you sure you want to perform this attack?\n" +
                    attack.toString() + "\n" +
                    successStr);
                if (userConfirmed) {
                    executeAttack(cards, attack, btn, card);
                }
            } else {
                executeAttack(cards, attack, btn, card);
            }
        };
    }
    return btn;
}

function executeAttack(cards: CardInfo[], attack: AttackInfo, element: HTMLButtonElement, card: CardInfo) {
    const lastClickTime = GM_getValue('lastClickTime', 0);
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTime;
    if (timeSinceLastClick < 2000) {
        return delay(2000 - timeSinceLastClick).then(() => {
            executeAttack(cards, attack, element, card);
        });
    }
    GM_setValue('lastClickTime', currentTime);

    return handleButtonClick(element, async () => {
        const url = window.location.origin + "/nation/war/" + attack.endpoint + "/war=" + card.id;
        const doc = await get(url);
        const token = (doc.querySelector('[name=token]') as HTMLInputElement).value;
        const data = attack.postData();
        data['token'] = token;
        data['attack'] = '';
        const urlData = new URLSearchParams(Object.entries(data));
        return post(url, urlData);
    }, (doc) => {
        const resultsElem = doc.querySelector('#results');
        if (resultsElem) {
            setAlert(resultsElem.innerHTML, true);
            const resultStr = resultsElem.textContent as string;
            const details = extractBattleDetailsInferred(resultStr, attack);
            setCard(card, attack, details);
            setAutoAndValidAttacks(cards);
        } else {
            const errorElem = doc.querySelector('.pw-alert-red');
            if (errorElem) {
                setAlert(errorElem.innerHTML, false);
            } else {
                setAlert("No results element found", false);
                console.log(doc.body.innerHTML);
            }
        }
        updateResources(doc);
    });
}

function setAlert(message: string, isSuccess: boolean) {
    let alertDiv = document.getElementById('alert-div') as HTMLElement;
    alertDiv.innerHTML = '';

    const child = document.createElement('div');
    child.id = 'alert-message';
    const alertColor = isSuccess ? 'pw-alert-green' : 'pw-alert-red';
    child.classList.add('p-4', 'm-2', 'strong', 'bg-red-300', 'pw-alert', alertColor);
    child.innerHTML = message;
    alertDiv.appendChild(child);
}

function updateResources(doc: Document) {
    const infoBar = document.querySelector('.informationbar');
    if (!infoBar) return;
    const newInfoBar = doc.querySelector('.informationbar');
    if (!newInfoBar) return;
    infoBar.replaceWith(newInfoBar);
}

function addRebuyButtons(cards: CardInfo[]) {
    let tailwindBody = getFinalBody();
    let rebuyDiv: HTMLElement = document.querySelector('#rebuy-div') as HTMLElement;

    let rebuyButton = document.querySelector('#rebuy-button') as HTMLButtonElement;
    let sellButton = document.querySelector('#sell-button') as HTMLButtonElement;
    let fetchProjectsButton = document.querySelector('#projects-button') as HTMLButtonElement;

    if (!rebuyDiv) {
        rebuyDiv = document.createElement('div');
        rebuyDiv.id = 'rebuy-div';
        rebuyDiv.classList.add('flex', 'gap-0.5', 'mt-2', 'w-full');
        tailwindBody.insertBefore(rebuyDiv, tailwindBody.children[3]);

        addCheckboxWithGMVariable('rebuy_soldier', 'soldiers', (checked) => {}, (checked) => {}, rebuyDiv, false);
        addCheckboxWithGMVariable('rebuy_tank', 'tanks', (checked) => {}, (checked) => {}, rebuyDiv, false);
        addCheckboxWithGMVariable('rebuy_aircraft', 'aircraft', (checked) => {}, (checked) => {}, rebuyDiv, false);
        addCheckboxWithGMVariable('rebuy_ship', 'ships', (checked) => {}, (checked) => {}, rebuyDiv, false);

        rebuyButton = document.createElement('button');
        rebuyButton.textContent = 'Rebuy';
        rebuyButton.classList.add(`bg-blue-600`, `hover:bg-blue-700`, `active:bg-blue-800`, 'rounded', 'px-2', 'text-white', 'strong');
        rebuyDiv.appendChild(rebuyButton);

        rebuyDiv.appendChild(VR());

        // Add sell non soldier
        sellButton = document.createElement('button');
        sellButton.textContent = 'Sell All Non-Soldiers';
        sellButton.classList.add(`bg-blue-600`, `hover:bg-blue-700`, `active:bg-blue-800`, 'rounded', 'px-2', 'text-white', 'strong');
        rebuyDiv.appendChild(sellButton);

        // Add bank deposit link
        const sideBar = document.querySelector('#leftcolumn') as HTMLElement;
        const bankLink = sideBar.querySelector('a[href*="alliance/id="]') as HTMLAnchorElement;
        if (bankLink) {
            rebuyDiv.appendChild(VR());

            const bankButton = document.createElement('a');
            bankButton.textContent = 'Deposit Page';
            bankButton.href = bankLink.href + '&display=bank#deposit';
            bankButton.classList.add(`bg-blue-600`, `hover:bg-blue-700`, `active:bg-blue-800`, 'rounded', 'px-2', 'text-white', 'strong', 'items-center', 'justify-center', 'flex');
            rebuyDiv.appendChild(bankButton);
        }

        rebuyDiv.appendChild(VR());
        fetchProjectsButton = document.createElement('button');
        fetchProjectsButton.textContent = 'Fetch ID/VDS';
        fetchProjectsButton.classList.add(`bg-blue-600`, `hover:bg-blue-700`, `active:bg-blue-800`, 'rounded', 'px-2', 'text-white', 'strong');
        rebuyDiv.appendChild(fetchProjectsButton);
    }

    rebuyButton.addEventListener('click', () => {
        const states = [
            GM_getValue('rebuy_soldier', false),
            GM_getValue('rebuy_tank', false),
            GM_getValue('rebuy_aircraft', false),
            GM_getValue('rebuy_ship', false),
        ];
        const self = cards.length > 0 ? cards[0].self : undefined;
        handleButtonClick(rebuyButton, () =>
            rebuy(states, self, true), f => handleRebuyResponse(f, cards));
    });

    sellButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to sell all non-soldier units?")) {
            const self = cards.length > 0 ? cards[0].self : undefined;
            handleButtonClick(sellButton, () =>
                rebuy([false, true, true, true], self, false), f => handleRebuyResponse(f, cards));
        }
    });

    fetchProjectsButton.addEventListener('click', (event) => {
        fetchProjects(event.currentTarget as HTMLButtonElement, cards);
    });
}

function handleRebuyResponse(response: [number, number, number, number, string], cards: CardInfo[]) {
    const [soldier, tank, aircraft, ship, message] = response;
    const isSuccess = soldier + tank + aircraft + ship > 0;
    if (message) setAlert(message, isSuccess);
    if (isSuccess) updateCardsForRebuy([soldier, tank, aircraft, ship], cards);
}

function updateCardsForRebuy(units: number[], cards: CardInfo[]) {
    let hasChanged = units.some(unit => unit !== 0);
    if (!hasChanged) return false;
    for (let card of cards) {
        card.self.soldier! += units[0];
        card.self.tank! += units[1];
        card.self.aircraft! += units[2];
        card.self.ship! += units[3];
        setCard(card, undefined, undefined);
    }

    return true;
}

async function rebuy(units: boolean[], self: CardSide | undefined, buyOrsell: boolean): Promise<[number, number, number, number, string]> {
    const unitInfo: [UnitPurchaseFormInfo, number, number][] = [];
    if (units[0]) unitInfo.push([UNIT_PURCHASES.Soldiers, self ? self.soldier! : -1, 0]);
    if (units[1]) unitInfo.push([UNIT_PURCHASES.Tanks, self ? self.tank! : -1, 1]);
    if (units[2]) unitInfo.push([UNIT_PURCHASES.Aircraft, self ? self.aircraft! : -1, 2]);
    if (units[3]) unitInfo.push([UNIT_PURCHASES.Ships, self ? self.ship! : -1, 3]);
    if (unitInfo.length === 0) {
        return [0, 0, 0, 0, 'No units selected'];
    }
    let message = '';
    let result = [0, 0, 0, 0];
    for (let i = 0; i < unitInfo.length; i++) {
        const [amt, msg] = await buyUnit(unitInfo[i][0], buyOrsell, unitInfo[i][1]);
        result[unitInfo[i][2]] = amt;
        message += msg + '\n';
        await delay(10);
    }
    return [result[0], result[1], result[2], result[3], message.trim()];
}

function buyUnit(unitInfo: UnitPurchaseFormInfo, buyOrSell: boolean, currentAmount: number): Promise<[number, string]> {
    const url = window.location.origin + unitInfo.url;
    if (!buyOrSell && currentAmount === 0) {
        return Promise.resolve([0, `No ${unitInfo.name} to sell`]);
    }
    const result: Promise<[number, string]> = get(url).then(doc => {
        const form = doc.querySelector('form');
        if (!form) {
            return Promise.reject<[number, string]>([0, 'Form not found']);
        }
        const postData: { [key: string]: string } = {};
        const token = (doc.querySelector('[name=token]') as HTMLInputElement).value;
        postData['token'] = token;

        const submit = form.querySelector('input[type=submit]') as HTMLInputElement;
        postData[submit.name] = submit.value;

        const amountInput = form.querySelector('input[type=text]') as HTMLInputElement;
        let amt = buyOrSell ? parseInt(amountInput.value ?? '0') : parseInt(amountInput.getAttribute('minimum') ?? '0');
        if (amt === 0 && unitInfo.isProjectile && buyOrSell) {
            amt = 1;
        }
        if (currentAmount != -1 && !buyOrSell) {
            amt = -currentAmount;
        }
        postData[amountInput.name] = amt.toString();
        if (amt === 0) {
            return Promise.resolve<[number, string]>([0, `No ${unitInfo.name} to ${buyOrSell ? 'buy' : 'sell'}`]);
        }
        return post(url, new URLSearchParams(Object.entries(postData))).then(doc => {
            let alert = doc.querySelector('.alert.alert-success');
            if (alert) {
                return [amt, alert.textContent!.trim()];
            }
            alert = doc.querySelector('.alert.alert-danger');
            if (alert) {
                return [0, alert.textContent!.trim()];
            }
            return [0, `Attempted to purchase ${amt} ${unitInfo.name} but no response was found`];
        });
    }).catch(error => {
        console.error("Request failed:", error);
        return [0, 'Request failed'];
    }) as Promise<[number, string]>;
    return result;
}

function fetchProjects(btn: HTMLButtonElement, cards: CardInfo[]) {
    const nationIds = cards.map(card => card.other.nation_id);
    if (nationIds.length == 0) {
        alert("No wars found");
        return;
    }
    handleButtonClick(btn, async () => {
        return getOrFetchProjectsForAll(nationIds, true, 6);
    }, byNation => {
        for (let card of cards) {
            const nationId = card.other.nation_id;
            card.enemy_project_bits = byNation[nationId];
            setEnemyProjects(card);
        }
        alert("Successfully fetched projects for " + nationIds.length + " nations");
    });
}
