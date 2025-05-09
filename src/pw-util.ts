import {CardInfo, CardSide} from "./wars";
import {formatSi} from "./lib";

export function getOdds(attStrength: number, defStrength: number, success: number): number {
    attStrength = Math.pow(attStrength, 0.75);
    defStrength = Math.pow(defStrength, 0.75);

    const a1 = attStrength * 0.4;
    const a2 = attStrength;
    const b1 = defStrength * 0.4;
    const b2 = defStrength;

    if (attStrength <= 0) return success === 0 ? 1 : 0;
    if (defStrength * 2.5 <= attStrength) return success === 3 ? 1 : 0;
    if (a2 <= b1 || b2 <= a1) return success === 0 ? 1 : 0;

    const sampleSpace = (a2 - a1) * (b2 - b1);
    const overlap = Math.min(a2, b2) - Math.max(a1, b1);
    let p = (overlap * overlap * 0.5) / sampleSpace;
    if (attStrength > defStrength) p = 1 - p;

    if (p <= 0) return 0;
    if (p >= 1) return 1;

    const k = success;
    const n = 3;

    const odds = Math.pow(p, k) * Math.pow(1 - p, n - k);
    const npr = factorial(n) / (factorial(k) * factorial(n - k));
    return odds * npr;
}

export function getOddsArr(attStrength: number, defStrength: number): number[] {
    return [0, 1, 2, 3].map(success => getOdds(attStrength, defStrength, success));
}

function factorial(n: number): number {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

export enum Resources {
    CREDITS = "credits",
    COAL = "coal",
    OIL = "oil",
    URANIUM = "uranium",
    LEAD = "lead",
    IRON = "iron",
    BAUXITE = "bauxite",
    GASOLINE = "gasoline",
    MUNITIONS = "munitions",
    STEEL = "steel",
    ALUMINUM = "aluminum",
    FOOD = "food",
    MONEY = "money"
}

export function parseResource(resource: string): Resources | undefined {
    if (Object.values(Resources).includes(resource as Resources)) {
        return resource as Resources;
    }
    return undefined;
}

export function parseResourceHtml(elem: Element): { [key in Resources]?: number } {
    const resourceMap: { [key in Resources]?: number } = {};

    const resourceElements = elem.querySelectorAll('a[aria-label]');
    resourceElements.forEach(resourceElement => {
        const resourceLabel = resourceElement.getAttribute('aria-label') as string;
        const resourceValueText = resourceElement.nextSibling?.textContent?.trim().replace(/,/g, '');
        const resourceValue = resourceValueText ? parseFloat(resourceValueText) : 0;
        const resourceEnum = parseResource(resourceLabel.toLowerCase());

        if (resourceEnum) {
            resourceMap[resourceEnum] = resourceValue;
        }
    });

    return resourceMap;
}

export function parseCostHtml(elem: Element): { [key in Resources]?: number } {
    const costMap: { [key in Resources]?: number } = {};
    // find each resource icon + tooltip
    const costItems = elem.querySelectorAll('span.pw-tooltip');
    costItems.forEach(span => {
        // resource name is inside the tooltip-content div
        const tooltipContent = span.querySelector('.pw-tooltip-content');
        const resourceName = tooltipContent?.textContent?.trim().toLowerCase();
        // the numeric cost lives in the text node right after the span
        let valueText = '';
        const parent = span.parentElement;
        if (parent) {
            const nodes = Array.from(parent.childNodes);
            const idx = nodes.indexOf(span);
            if (idx >= 0) {
                for (let i = idx + 1; i < nodes.length; i++) {
                    const txt = nodes[i].textContent?.trim();
                    if (txt) { valueText = txt; break; }
                }
            }
        }
        const amount = valueText
            ? parseFloat(valueText.replace(/,/g, ''))
            : 0;
        // map string to enum
        const resourceEnum = resourceName
            ? parseResource(resourceName)
            : undefined;
        if (resourceEnum) {
            costMap[resourceEnum] = amount;
        }
    });
    return costMap;
}

export function getResources(): { [key in Resources]?: number } {
    const infoBar = document.querySelector('.informationbar');
    if (!infoBar) {
        return {};
    }
    return parseResourceHtml(infoBar);
}


export function groundStrength(soldiers: number, tanks: number, munitions: boolean, opponentAS: boolean): number {
    return soldiers * (munitions ? 1.75 : 1) + tanks * 40 * (opponentAS ? 0.5 : 1);
}

export function attacksForConsumption(resourcesPerAttack: { [key in Resources]?: number }, resources: { [key in Resources]?: number }): number {
    let attacks = Number.MAX_SAFE_INTEGER;
    for (const key in resourcesPerAttack) {
        if (resourcesPerAttack.hasOwnProperty(key)) {
            const resource = key as Resources;
            const resourcePerAttack = resourcesPerAttack[resource]!;
            const resourceAmount = resources[resource] || 0;
            if (resourcePerAttack > 0) {
                attacks = Math.min(attacks, Math.floor(resourceAmount / resourcePerAttack));
            }
        }
    }
    return attacks;
}

export function addOrSubtractResources(resources: { [key in Resources]?: number }, resourcesToAdd: { [key in Resources]?: number }, subtract: boolean): { [key in Resources]?: number } {
    const newResources = { ...resources };
    for (const key in resourcesToAdd) {
        if (resourcesToAdd.hasOwnProperty(key)) {
            const resource = key as Resources;
            const resourceAmount = resourcesToAdd[resource]!;
            newResources[resource] = (resources[resource] || 0) + (subtract ? -resourceAmount : resourceAmount);
        }
    }
    return newResources;
}

export function getMaxGroundStrength(self: CardSide, other: CardSide, resources?: { [key in Resources]?: number }): number {
    let soldierStr = self.soldier!;
    let tanks = self.tank!;
    if (resources) {
        const perSoldier = attackConsumption({soldier: 1});
        const maxSoldiers = Math.min(self.soldier!, attacksForConsumption(perSoldier, resources));
        soldierStr = Math.max(groundStrength(maxSoldiers, 0, true, false), soldierStr);
        if (maxSoldiers == self.soldier!) {
            const soldierConsumption = attackConsumption({soldier: maxSoldiers});
            const remainingRss = addOrSubtractResources(resources, soldierConsumption, true);
            const perTank = attackConsumption({tank: 1});
            tanks = Math.min(self.tank!, attacksForConsumption(perTank, remainingRss));
        } else {
            tanks = 0;
        }
    } else {
        soldierStr = groundStrength(soldierStr, 0, true, false);
    }
    return (tanks > 0 ? groundStrength(0, tanks, true, other.status.includes(Status.AIR_SUPERIORITY)) : 0) + soldierStr;
}

export function getValidAttacks(card: CardInfo): AttackInfo[] {
    const validAttacks: AttackInfo[] = [];
    if (card.self.map == 0 || card.other.resistance == 0 || card.self.resistance == 0) return validAttacks;
    const attMap = card.self.map;
    const attacker = card.self;
    const defender = card.other;

    const resources = getResources();
    if (attacker.soldier! >= 50) { // ground
        const defGroundStr = groundStrength(defender.soldier!, defender.tank!, true, card.self.status.includes(Status.AIR_SUPERIORITY));
        const ga1 = new GroundAttack({}, false, getOddsArr(attacker.soldier!, defGroundStr), attacker.soldier!, 0, false, attMap >= 3);
        validAttacks.push(ga1);
        const perSoldier = attackConsumption({ soldier: 1 });
        const maxSoldiers = Math.min(attacker.soldier!, attacksForConsumption(perSoldier, resources));
        const soldierConsumption = attackConsumption({ soldier: maxSoldiers });
        if (maxSoldiers > 0) {
            const odds1 = getOddsArr(maxSoldiers, defGroundStr);
            {
                if (ga1.odds[3] != 1) ga1.requirePrompt = true;
                const ga2 = new GroundAttack(soldierConsumption, maxSoldiers < attacker.soldier!, odds1, maxSoldiers, 0, true, attMap >= 3).setRequirePrompt(odds1[0] == 1);
                validAttacks.push(ga2);
                if (maxSoldiers == attacker.soldier!) { // soldiers, with muni, + tanks
                    const remainingRss = addOrSubtractResources(resources, soldierConsumption, true);
                    const perTank = attackConsumption({tank: 1});
                    const maxTanks = Math.min(attacker.tank!, attacksForConsumption(perTank, remainingRss));
                    const tankConsumption = attackConsumption({tank: maxTanks});
                    const soldierAndTankConsumption = addOrSubtractResources(soldierConsumption, tankConsumption, false);
                    if (maxTanks > 0) {
                        const odds2 = getOddsArr(groundStrength(maxSoldiers, maxTanks, true, card.other.status.includes(Status.AIR_SUPERIORITY)), defGroundStr);
                        {
                            if (ga2.odds[3] != 1) ga2.requirePrompt = true;
                            validAttacks.push(new GroundAttack(soldierAndTankConsumption, maxTanks < attacker.tank!, odds2, maxSoldiers, maxTanks, true, attMap >= 3).setRequirePrompt(odds2[0] > 0.8));
                        }
                    }
                }
            }
        }
    }
    if (attacker.aircraft! >= 3) { // air
        const perAircraft = attackConsumption({ aircraft: 1 });
        const maxAircraft = Math.min(attacker.aircraft!, attacksForConsumption(perAircraft, resources));
        const aircraftConsumption = attackConsumption({ aircraft: maxAircraft });
        if (maxAircraft > 0) {
            const odds = getOddsArr(maxAircraft, defender.aircraft!);
            {
                validAttacks.push(new Airstrike(aircraftConsumption, maxAircraft < attacker.aircraft!, odds, maxAircraft, AirstrikeTarget.TARGET_AIRCRAFT, attMap >= 4).setRequirePrompt(odds[0] == 1));
            }
        }
    }
    if (attacker.ship! > 0) { // ship
        const perShip = attackConsumption({ ship: 1 });
        const maxShips = Math.min(attacker.ship!, attacksForConsumption(perShip, resources));
        const shipConsumption = attackConsumption({ ship: maxShips });
        if (maxShips > 0) {
            const odds = getOddsArr(maxShips, defender.ship!);
            {
                const lowRss = maxShips < attacker.ship!;
                const hasMap = attMap >= 4;
                const reqPrompt = odds[0] > 0.8;
                validAttacks.push(new NavalAttack(shipConsumption, lowRss, odds, maxShips, NavalTarget.TARGET_SHIPS, hasMap).setRequirePrompt(reqPrompt));
                validAttacks.push(new NavalAttack(shipConsumption, lowRss, odds, maxShips, NavalTarget.TARGET_AIR, hasMap).setRequirePrompt(reqPrompt));
                validAttacks.push(new NavalAttack(shipConsumption, lowRss, odds, maxShips, NavalTarget.TARGET_GROUND, hasMap).setRequirePrompt(reqPrompt));
                validAttacks.push(new NavalAttack(shipConsumption, lowRss, odds, maxShips, NavalTarget.TARGET_INFRASTRUCTURE, hasMap).setRequirePrompt(reqPrompt));
            }
        }
    }
    if (attacker.missile! > 0 && attacker.map >= 8) {
        validAttacks.push(new MissileAttack(true));
    }
    if (attacker.nuke! > 0 && attacker.map >= 12) {
        validAttacks.push(new NukeAttack(true));
    }
    return validAttacks;
}

export class AttackInfo {
    endpoint: string;
    consumption: { [key in Resources]?: number };
    low_rss: boolean;
    odds: number[];
    requirePrompt: boolean;
    mapCost: number;
    hasMap: boolean;
    disabled: boolean;

    constructor(endpoint: string, consumption: { [key in Resources]?: number }, low_rss: boolean, odds: number[], map: number, hasMap: boolean) {
        this.endpoint = endpoint;
        this.consumption = consumption;
        this.low_rss = low_rss;
        this.odds = odds;
        this.requirePrompt = odds[3] <= 0.01;
        this.mapCost = map;
        this.hasMap = hasMap;
        this.disabled = false;
    }


    setDisabled(b: boolean) {
        this.disabled = b;
        return this;
    }

    setRequirePrompt(b: boolean) {
        this.requirePrompt = b;
        return this;
    }

    toString(): string {
        return `Endpoint: ${this.endpoint}, Consumption: ${JSON.stringify(this.consumption)}, Low RSS: ${this.low_rss}, Odds: ${this.odds.join(', ')}`;
    }

    prompt(value: boolean): AttackInfo {
        this.requirePrompt = value;
        return this;
    }

    postData(): { [key: string]: string } {
        const baseProperties = new AttackInfo('', {}, false, [], 0, false);
        const extendedProperties: { [key: string]: any } = {};

        for (const key in this) {
            if (!(key in baseProperties)) {
                const value = (this as any)[key];
                if (typeof value === 'boolean') {
                    if (value) {
                        extendedProperties[key] = 'on';
                    }
                } else {
                    extendedProperties[key] = value;
                }
            }
        }

        return extendedProperties;
    }
}

export class MissileAttack extends AttackInfo {
    improvementCategory: number;
    cityId: number;

    constructor(hasMap: boolean) {
        super('missile', {}, false, [0, 1, 0, 0], 8, hasMap);
        this.improvementCategory = 2;
        this.cityId = 0;
        this.requirePrompt = true;
    }

    toString(): string {
        return "Launch Missile";
    }
}

export class NukeAttack extends AttackInfo {
    cityId: number;

    constructor(hasMap: boolean) {
        super('nuke', {}, false, [0, 1, 0, 0], 12, hasMap);
        this.cityId = 0;
        this.requirePrompt = true;
    }

    toString(): string {
        return "Launch Nuke";
    }
}

export class GroundAttack extends AttackInfo {
    attSoldiers: number;
    attTanks: number;
    soldiersUseMunitions: boolean;

    constructor(consumption: { [key in Resources]?: number }, low_rss: boolean, odds: number[], attSoldiers: number, attTanks: number, soldiersUseMunitions: boolean, hasMap: boolean) {
        super('groundbattle', consumption, low_rss, odds, 3, hasMap);
        this.attSoldiers = attSoldiers;
        this.attTanks = attTanks;
        this.soldiersUseMunitions = soldiersUseMunitions;
    }

    toString(): string {
        let msg = 'Ground';
        if (this.soldiersUseMunitions) msg += " (armed)";
        else msg += " (unarmed)";
        if (!this.attTanks) msg += ' (no tanks)';
        return msg;
    }
}

export enum Status {
    GROUND_CONTROL = "ground control",
    AIR_SUPERIORITY = "air superiority",
    NAVAL_BLOCKADING = "naval blockading",
}

export function getStatusHtml(status: Status): string {
    const icon = getStatusIcon(status);
    return `<span class="group pw-tooltip" aria-describedby="tooltip_${status}">${icon}<div class="pw-tooltip-content" id="tooltip_${status}" role="tooltip">${status}</div></span>`;
}

export function getStatusIcon(status: Status): string {
    switch (status) {
        case Status.GROUND_CONTROL:
            return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-tank" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" fill="none"></path> <path d="M2 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v0a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"></path> <path d="M6 12l1 -5h5l3 5"></path> <path d="M21 9l-7.8 0"></path></svg>`;
        case Status.AIR_SUPERIORITY:
            return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plane-tilt" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" fill="none"></path> <path d="M14.5 6.5l3 -2.9a2.05 2.05 0 0 1 2.9 2.9l-2.9 3l2.5 7.5l-2.5 2.55l-3.5 -6.55l-3 3v3l-2 2l-1.5 -4.5l-4.5 -1.5l2 -2h3l3 -3l-6.5 -3.5l2.5 -2.5l7.5 2.5z"></path></svg>`;
        case Status.NAVAL_BLOCKADING:
            return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-ship" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" fill="none"></path> <path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1"></path> <path d="M4 18l-1 -5h18l-2 4"></path> <path d="M5 13v-6h8l4 6"></path> <path d="M7 7v-4h-1"></path></svg>`;
    }
}

export enum AirstrikeTarget {
    TARGET_AIRCRAFT = "airstrike6",
    TARGET_SOLDIERS = "airstrike2",
    TARGET_TANKS = "airstrike3",
    TARGET_SHIPS = "airstrike5",
    TARGET_MONEY = "airstrike4",
    TARGET_INFRASTRUCTURE = "airstrike1"
}
export class Airstrike extends AttackInfo {
    attAircraft: number;
    type: AirstrikeTarget;

    constructor(consumption: { [key in Resources]?: number }, low_rss: boolean, odds: number[], attAircraft: number, type: AirstrikeTarget, hasMap: boolean) {
        super('airstrike', consumption, low_rss, odds, 4, hasMap);
        this.attAircraft = attAircraft;
        this.type = type;
    }

    toString(): string {
        const enumKey = Object.keys(AirstrikeTarget).find(key => AirstrikeTarget[key as keyof typeof AirstrikeTarget] === this.type);
        if (enumKey) {
            return enumKey.replace('TARGET', 'AIRSTRIKE').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        }
        return 'Airstrike';
    }
}

export enum NavalTarget {
    TARGET_INFRASTRUCTURE = "navalInfra",
    TARGET_SHIPS = "navalShips",
    TARGET_GROUND = "navalGround",
    TARGET_AIR = "navalAir"
}

export class NavalAttack extends AttackInfo {
    attShips: number;
    type: NavalTarget;

    constructor(consumption: { [key in Resources]?: number }, low_rss: boolean, odds: number[], attShips: number, type: NavalTarget, hasMap: boolean) {
        super('navalbattle', consumption, low_rss, odds, 4, hasMap);
        this.attShips = attShips;
        this.type = type;
    }

    toString(): string {
        return this.type;
    }
}

export type MilitaryUnits = {
    soldier?: number,
    tank?: number,
    aircraft?: number,
    ship?: number,
    missile?: number,
    nuke?: number,
}

export function attackConsumption(units: MilitaryUnits): { [key in Resources]?: number } {
    // only the muni/gas consumption is relevant for this
    let consumption: { [key in Resources]?: number } = {};
    if (units.soldier) {
        consumption[Resources.MUNITIONS] = units.soldier / 5000.0;
    }
    if (units.tank) {
        consumption[Resources.GASOLINE] = units.tank / 100.0;
        consumption[Resources.MUNITIONS] = units.tank / 100.0;
    }
    if (units.aircraft) {
        consumption[Resources.GASOLINE] = units.aircraft / 4.0;
        consumption[Resources.MUNITIONS] = units.aircraft / 4.0;
    }
    if (units.ship) {
        consumption[Resources.GASOLINE] = 1.5;
        consumption[Resources.MUNITIONS] = 2.5;
    }
    for (const key in consumption) {
        if (consumption.hasOwnProperty(key)) {
            consumption[key as keyof typeof consumption] = Math.round(consumption[key as keyof typeof consumption]! * 100) / 100;
        }
    }
    return consumption;
}

export const UNIT_NAMES: string[] = ["Soldiers", "Tanks", "Aircraft", "Ships", "Missiles", "Nukes", "Spies"];

export interface BattleDetails {
    success: number;
    resistance: number;
    yourForces: { [unitType: string]: number };
    opponentForces: { [unitType: string]: number };
    munitions: number;
    gasoline: number;
    infrastructureDestroyed: number;
}

export function extractBattleDetailsInferred(text: string, attack: AttackInfo) {
    let unitTypes: string[] = [];
    if (attack instanceof GroundAttack) {
        unitTypes = ['soldiers', 'tanks'];
    } else if (attack instanceof Airstrike) {
        unitTypes = ['aircraft'];
    } else if (attack instanceof NavalAttack) {
        unitTypes = ['ships'];
    }
    return extractBattleDetails(text, unitTypes);
}

export function extractBattleDetails(text: string, unitTypes: string[]): BattleDetails {
    const resistanceMatch = /losing (\d+) resistance/.exec(text);
    const yourForcesMatch = /Your forces lost ([\d\s\w,]+) while/.exec(text);
    const opponentForcesMatch = /while ([\w\s']+?)'s defenders lost ([\d\s\w,]+)/.exec(text);
    const munitionsMatch = /used ([\d.]+) munitions/.exec(text);
    const gasolineMatch = /([\d.]+) gasoline/.exec(text);
    const infrastructureMatch = /destroyed as well as (\d+) infrastructure/.exec(text);
    const successStr = /The attack was an ([a-z]+ [a-z]+),/.exec(text);
    const successMap: { [key: string]: number } = {
        "utter failure": 0,
        "pyrrhic victory": 1,
        "moderate success": 2,
        "immense triumph": 3
    };
    const successOrdinal = successStr ? successMap[successStr[1]] ?? -1 : -1;

    const parseForces = (forces: string, unitTypes: string[]) => {
        return unitTypes.reduce((acc, unitType) => {
            const regex = new RegExp(`(\\d+)\\s+${unitType}`);
            const match = regex.exec(forces);
            if (match) {
                acc[unitType] = parseInt(match[1]);
            } else {
                acc[unitType] = 0;
            }
            return acc;
        }, {} as { [unitType: string]: number });
    };

    return {
        success: successOrdinal,
        resistance: resistanceMatch ? parseInt(resistanceMatch[1]) : 0,
        yourForces: yourForcesMatch ? parseForces(yourForcesMatch[1], unitTypes) : {},
        opponentForces: opponentForcesMatch ? parseForces(opponentForcesMatch[2], unitTypes) : {},
        munitions: munitionsMatch ? parseFloat(munitionsMatch[1]) : 0,
        gasoline: gasolineMatch ? parseFloat(gasolineMatch[1]) : 0,
        infrastructureDestroyed: infrastructureMatch ? parseInt(infrastructureMatch[1]) : 0,
    };
}

export function getWarUrl(nationId: number, warType: string, reason: string) {
    return window.location.origin + `/nation/war/declare/id=${nationId}?auto=true&type=${warType}&reason=${encodeURIComponent(reason)}`;
}