import {getOdds, groundStrength, MilitaryUnits, strengthComparison} from "./pw-util";

export function initWarsPage() {
    const url = "/index.php?id=15&amp;keyword=1725.26&amp;cat=war_range&amp;ob=score&amp;od=ASC&amp;maximum=15&amp;minimum=0&amp;search=Go&amp;beige=true&amp;vmode=false&amp;openslots=true";
    // find a href with the above url

    initMyUnits();
}

type CardInfo = {
    element: Element;
    self: CardSide;
    other: CardSide;
}

type CardSide = MilitaryUnits & {
    name: string;
    nation_id: number;
    alliance_id: number;
    alliance_name: string;
    resistance: number;
    map: number;
}

function parseUnits() {
    const cards: CardInfo[] = [];
    const elems = document.querySelectorAll('.pw-card');
    if (!elems) return cards;
    elems.forEach(card => {
        const selfUnits = parseCardSide(card, false);
        const opponentUnits = parseCardSide(card, true);
        cards.push({ element: card, self: selfUnits, other: opponentUnits });
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

    const o = side ? 1 : 0;
    const sideElements = card.querySelectorAll('.grid.grid-cols-2.gap-2');
    console.log("Side elements");
    console.log(sideElements);
    { // nation
        console.log("Nation children");
        console.log(sideElements[4].children);
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
    { // resistance
        const resDiv = sideElements[8].children[o];
        const resText = resDiv.textContent!.trim();
        const [res, resMax] = resText.split('/');
        resistance = parseInt(res);
    }
    { // map
        const mapDiv = sideElements[10].children[o];
        const mapText = mapDiv.textContent!.trim();
        const [mapCur, mapMax] = mapText.split('/');
        map = parseInt(mapCur);
    }
    { // units
        const unitDiv = sideElements[12].children[o];
        const unitIcons = unitDiv.querySelectorAll('.pw-tooltip-content');
        soldier = parseInt(unitIcons[0].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        tank = parseInt(unitIcons[1].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        aircraft = parseInt(unitIcons[2].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        ship = parseInt(unitIcons[3].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        missile = parseInt(unitIcons[4].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        nuke = parseInt(unitIcons[5].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
    }

    return { name, nation_id, alliance_id, alliance_name, soldier, tank, aircraft, ship, missile, nuke, resistance, map };
}

function initMyUnits() {
    const cards: CardInfo[] = parseUnits();
    if (!cards) return;

    for (const card of cards) {
        const comparison = strengthComparison(card.self, card.other);

        const json = JSON.stringify(card.self) + "\n" + JSON.stringify(card.other) + "\n\n" + JSON.stringify(comparison);
        const pre = document.createElement('code');
        pre.textContent = json;
        card.element.appendChild(pre);


    }
}