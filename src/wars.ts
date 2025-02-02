import {
    Airstrike,
    AirstrikeTarget,
    AttackInfo,
    BattleDetails,
    extractBattleDetailsInferred,
    getOdds,
    getResources,
    getStatusHtml,
    getValidAttacks,
    GroundAttack,
    groundStrength,
    MilitaryUnits,
    NavalAttack,
    Status
} from "./pw-util";
import {createElement, createElementText, formatSi, get, post, replaceTextWithoutRemovingChildren, span} from "./lib";

export function initWarsPage() {
    const url = "/index.php?id=15&amp;keyword=1725.26&amp;cat=war_range&amp;ob=score&amp;od=ASC&amp;maximum=15&amp;minimum=0&amp;search=Go&amp;beige=true&amp;vmode=false&amp;openslots=true";
    removeElems();
    initMyUnits();
}

function removeElems() {
    const tailwindBodies = document.querySelectorAll('#tailwind-body');
    if (!tailwindBodies) {
        alert("Tailwind body not found");
        return;
    }
    const tailwindBody = tailwindBodies[tailwindBodies.length - 1];

    const tagsToRemove: { [key: string]: number } = { 'DIV': 1, 'P': 2, 'IMG': 1, 'HR': 1 };
    Array.from(tailwindBody.children).forEach(child => {
        const tag = child.tagName as keyof typeof tagsToRemove;
        if (tagsToRemove[tag] > 0) {
            tailwindBody.removeChild(child);
            tagsToRemove[tag]--;
        }
    });
}

export type CardInfo = {
    element: Element;
    self: CardSide;
    other: CardSide;
    id: number;
}

type CardSide = MilitaryUnits & {
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
        // get war id from <a href="/nation/war/timeline/war=163889" class="inline-flex text-xl items-center gap-0.5 text-white hover:text-gray-100 focus:text-gray-200
        //     bg-blue-600 hover:bg-blue-700 active:bg-blue-800 justify-center rounded py-2 px-3
        //     typically:no-underline w-full">War Timeline</a>
        const warLink = card.querySelector('a[href^="/nation/war/timeline/war="]');
        if (!warLink) return;
        const warID = parseInt(warLink.getAttribute('href')!.split('=')[1]);
        const selfUnits = parseCardSide(card, false);
        const opponentUnits = parseCardSide(card, true);
        cards.push({ element: card, self: selfUnits, other: opponentUnits, id: warID });
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
        soldier = parseInt(unitIcons[0].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        aircraft = parseInt(unitIcons[1].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        missile = parseInt(unitIcons[2].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        tank = parseInt(unitIcons[3].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        ship = parseInt(unitIcons[4].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        nuke = parseInt(unitIcons[5].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
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
    const dummyAttack = new GroundAttack({}, false, [0, 0, 0, 1], 500, 500, true);
    setCard(cards[0], dummyAttack, dummyDetails);
    // setCard(cards[0], undefined, undefined);
}

function initMyUnits() {
    const cards: CardInfo[] = parseUnits();
    if (!cards) return;

    for (const card of cards) {
        setValidAttacks(card);
    }
}

function setValidAttacks(card: CardInfo) {
    const attacks = getValidAttacks(card);
    let attackDiv = document.getElementById("warcard-" + card.id);
    if (!attackDiv) {
        attackDiv = document.createElement('div');
        attackDiv.id = "warcard-" + card.id;
        card.element.appendChild(attackDiv);
    } else {
        attackDiv.innerHTML = ''; // Clear existing content
    }
    for (const attack of attacks) {
        const btn = createAttackButton(attack, card);
        attackDiv.appendChild(btn);
    }
}

const createAttackButton = (attack: AttackInfo, card: CardInfo) => {
    const btn = document.createElement('button');
    const oddsLabels = ['UF', 'PV', 'MS', 'IT'];
    const oddsColors = ['red', 'orange', 'yellow', 'green'];
    const remapEndpoint = {
        groundbattle: 'ground',
        navalbattle: 'naval',
        airstrike: 'air',
    }

    let highestOdds = 0;
    let buttonBg = 'green';
    btn.textContent = attack.toString();
    attack.odds.forEach((odd, index) => {
        if (odd >= 0.01) {
            btn.appendChild(span(`${(odd * 100).toFixed(0)}% ${oddsLabels[index]}`));
            if (odd > attack.odds[highestOdds]) {
                highestOdds = index;
            }
        }
    });
    buttonBg = oddsColors[highestOdds];
    if (attack.low_rss) {
        btn.appendChild(span("low", ["https://politicsandwar.com/img/resources/munitions.png", "https://politicsandwar.com/img/resources/gasoline.png"]));
    }

    btn.classList.add('inline-flex', 'text-xs', 'items-center', 'gap-0.5', `bg-${buttonBg}-600`, `hover:bg-${buttonBg}-700`, `active:bg-${buttonBg}-800`, 'justify-center', 'rounded', 'px-2', 'w-full');
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
                executeAttack(attack, btn, card);
            }
        } else {
            executeAttack(attack, btn, card);
        }
    };
    return btn;
}

function executeAttack(attack: AttackInfo, element: HTMLButtonElement, card: CardInfo) {
    const initialContent = element.innerHTML;
    element.innerHTML = "Executing Attack...";
    element.disabled = true

    const url = window.location.origin + "/nation/war/" + attack.endpoint + "/war=" + card.id;
    get(url).then(doc => {
        const token = (doc.querySelector('[name=token]') as HTMLInputElement).value;
        const data = attack.postData();
        data['token'] = token;
        data['attack'] = '';
        const urlData = new URLSearchParams(Object.entries(data));
        post(url, urlData).then(doc => {
            const resultsElem = doc.querySelector('#results');
            if (resultsElem) {
                setAlert(resultsElem.innerHTML, true);
                const resultStr = resultsElem.textContent as string;
                const details = extractBattleDetailsInferred(resultStr, attack);
                setCard(card, attack, details);
                setValidAttacks(card);
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
        }).catch(error => {
            console.error("Post request failed:", error);
        }).finally(() => {
            element.innerHTML = initialContent;
            element.disabled = false;
        });
    }).catch(error => {
        console.error("Get request failed:", error);
        element.innerHTML = initialContent;
        element.disabled = false;
    });
}

function setAlert(message: string, isSuccess: boolean) {
    let tailwindBody = document.querySelector('#tailwind-body');
    if (!tailwindBody) tailwindBody = document.body;
    const existingAlert = tailwindBody.querySelector('#alert-message');
    if (existingAlert) {
        tailwindBody.removeChild(existingAlert);
    }
    const alertDiv = document.createElement('div');
    alertDiv.id = 'alert-message';
    const alertColor = isSuccess ? 'pw-alert-green' : 'pw-alert-red';
    alertDiv.classList.add('p-4', 'm-2', 'strong', 'bg-red-300', 'pw-alert', alertColor);
    alertDiv.innerHTML = message;
    tailwindBody.insertBefore(alertDiv, tailwindBody.firstChild);
    window.scrollTo({ top: 0 });
}

function updateResources(doc: Document) {
    const infoBar = document.querySelector('.informationbar');
    if (!infoBar) return;
    const newInfoBar = doc.querySelector('.informationbar');
    if (!newInfoBar) return;
    infoBar.replaceWith(newInfoBar);
}
