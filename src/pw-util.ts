export function getOdds(attStrength: number, defStrength: number, success: number): number {
    attStrength = Math.pow(attStrength, 0.75);
    defStrength = Math.pow(defStrength, 0.75);

    const a1 = attStrength * 0.4;
    const a2 = attStrength;
    const b1 = defStrength * 0.4;
    const b2 = defStrength;

    if (attStrength <= 0) return 0;
    if (defStrength * 2.5 <= attStrength) return success === 3 ? 1 : 0;
    if (a2 <= b1 || b2 <= a1) return 0;

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

function factorial(n: number): number {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

/*
<span style="float:right;">
<!--Credits-->
<a aria-label="Credits" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=credits&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go">
<img src="https://test.politicsandwar.com/img/icons/16/point_gold.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Credits"></a>
0                        <!--Coal-->
<a aria-label="Coal" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=coal&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go">
<img src="https://test.politicsandwar.com/img/resources/coal.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Coal"></a>
141,991.00                        <!--Oil-->
<a aria-label="Oil" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=oil&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go"><img src="https://test.politicsandwar.com/img/resources/oil.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Oil"></a> 141,991.00                        <!--Uranium-->
<a aria-label="Uranium" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=uranium&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go"><img src="https://test.politicsandwar.com/img/resources/uranium.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Uranium"></a> 141,991.00                        <!--Lead-->
<a aria-label="Lead" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=lead&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go">
<img src="https://test.politicsandwar.com/img/resources/lead.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Lead">
</a>
141,955.80                        <!--Iron-->
<a aria-label="Iron" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=iron&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go">
<img src="https://test.politicsandwar.com/img/resources/iron.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Iron"></a> 141,991.00                        <a aria-label="Bauxite" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=bauxite&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go"><img src="https://test.politicsandwar.com/img/resources/bauxite.png" data-toggle="tooltip" data-placement="bottom" title="" style="height:16px; width:16px;" data-original-title="Bauxite"></a> 141,991.00                        <a aria-label="Gasoline" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=gasoline&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go"><img src="https://test.politicsandwar.com/img/resources/gasoline.png" data-toggle="tooltip" data-placement="bottom" title="" style="height:16px; width:16px;" data-original-title="Gasoline"></a> 141,991.00                        <a aria-label="Munitions" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=munitions&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go"><img src="https://test.politicsandwar.com/img/resources/munitions.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Munitions"></a> 141,991.00                        <a aria-label="Steel" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=steel&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go"><img src="https://test.politicsandwar.com/img/resources/steel.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Steel"></a>141,926.00                        <a aria-label="Aluminum" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=aluminum&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go"><img src="https://test.politicsandwar.com/img/resources/aluminum.png" data-toggle="tooltip" data-placement="bottom" title="" style="width:16px; height:16px;" data-original-title="Aluminum"></a> 141,851.00                        <a aria-label="Food" href="https://test.politicsandwar.com/index.php?id=90&amp;display=world&amp;resource1=food&amp;buysell=sell&amp;ob=price&amp;od=DEF&amp;maximum=50&amp;minimum=0&amp;search=Go"><img src="https://test.politicsandwar.com/img/icons/16/steak_meat.png" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="Food">
</a>
351,169.37                        <!--Money-->
<a aria-label="Money" href="https://test.politicsandwar.com/nation/revenue/">
<b style="color: #28d020;" data-toggle="tooltip" data-placement="bottom" title="" data-original-title="Money">$</b>
</a>
1,652,316,903.56                    </span>
 */
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

        const resourceEnum = parseResource(resourceLabel);
        if (resourceEnum) {
            resourceMap[resourceEnum] = resourceValue;
        }
    });

    return resourceMap;
}


export function groundStrength(soldiers: number, tanks: number, munitions: boolean) {
    return soldiers * (munitions ? 1.75 : 1) + tanks * 40;
}

export function strengthComparison(attacker: MilitaryUnits, defender: MilitaryUnits): {
    GROUND_NO_MUNITIONS: number,
    GROUND_NO_TANKS: number,
    GROUND: number,
    AIR: number,
    SHIP: number
} {
    const defGroundStr = groundStrength(defender.soldier!, defender.tank!, true);

    const attNoTankNoMuni = groundStrength(attacker.soldier!, 0, false);
    const attNoTank = groundStrength(attacker.soldier!, 0, true);
    const attGround = groundStrength(attacker.soldier!, attacker.tank!, true);

    return {
        GROUND_NO_MUNITIONS: defGroundStr == 0 && attNoTankNoMuni > 0 ? Number.MAX_SAFE_INTEGER : attNoTankNoMuni / defGroundStr,
        GROUND_NO_TANKS: defGroundStr == 0 && attNoTank > 0 ? Number.MAX_SAFE_INTEGER : attNoTank / defGroundStr,
        GROUND: defGroundStr == 0 && attGround > 0 ? Number.MAX_SAFE_INTEGER : attGround / defGroundStr,
        AIR: defender.aircraft == 0 && attacker.aircraft != 0 ? Number.MAX_SAFE_INTEGER : attacker.aircraft! / defender.aircraft!,
        SHIP: defender.ship == 0 && attacker.ship != 0 ? Number.MAX_SAFE_INTEGER : attacker.ship! / defender.ship!
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