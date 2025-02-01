import {AttackInfo, getOdds, getResources, getValidAttacks, groundStrength, MilitaryUnits} from "./pw-util";
import {get, post, span} from "./lib";

export function initWarsPage() {
    const url = "/index.php?id=15&amp;keyword=1725.26&amp;cat=war_range&amp;ob=score&amp;od=ASC&amp;maximum=15&amp;minimum=0&amp;search=Go&amp;beige=true&amp;vmode=false&amp;openslots=true";
    // find a href with the above url

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
        const statusDiv = sideElements[9].children[o];
        const statusIcons = statusDiv.querySelectorAll('.pw-tooltip-content');
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

function initMyUnits() {
    const cards: CardInfo[] = parseUnits();
    if (!cards) return;

    for (const card of cards) {
        const attacks = getValidAttacks(card);

        // iterate each attack, generate attack button, appendChild to card
        for (const attack of attacks) {
            const btn = createAttackButton(attack, card);
            card.element.appendChild(btn);
        }
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