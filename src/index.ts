import {urlMatches} from './lib'
import {captcha} from "./captcha";
import {handleRedirect, handleWarType} from "./declare";
import {initBankScripts} from "./bank";
import {initWarsPage} from "./wars";
import {addDefaultStyles} from "./style";

const text = `You ordered a ground attack upon the nation of Gekko Embassy 2 led by geks. The attack was an immense triumph, resulting in your opponent losing 10 resistance. Your forces lost 83 soldiers and 0 tanks, while geks's defenders lost 0 soldiers and 0 tanks. You used 0.95 munitions and 0.00 gasoline executing the attack. The attack also destroyed as well as 1 infrastructure in the city of City 8 and stole $0.00.`;

interface BattleDetails {
    resistance: number;
    yourForces: { [unitType: string]: number };
    opponentForces: { [unitType: string]: number };
    munitions: number;
    gasoline: number;
    infrastructureDestroyed: number;
}

function extractBattleDetails(text: string, unitTypes: string[]): BattleDetails {
    const resistanceMatch = /losing (\d+) resistance/.exec(text);
    const yourForcesMatch = /Your forces lost ([\d\s\w,]+) while/.exec(text);
    const opponentForcesMatch = /while ([\w\s']+?)'s defenders lost ([\d\s\w,]+)/.exec(text);
    const munitionsMatch = /used ([\d.]+) munitions/.exec(text);
    const gasolineMatch = /([\d.]+) gasoline/.exec(text);
    const infrastructureMatch = /destroyed as well as (\d+) infrastructure/.exec(text);

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
        resistance: resistanceMatch ? parseInt(resistanceMatch[1]) : 0,
        yourForces: yourForcesMatch ? parseForces(yourForcesMatch[1], unitTypes) : {},
        opponentForces: opponentForcesMatch ? parseForces(opponentForcesMatch[2], unitTypes) : {},
        munitions: munitionsMatch ? parseFloat(munitionsMatch[1]) : 0,
        gasoline: gasolineMatch ? parseFloat(gasolineMatch[1]) : 0,
        infrastructureDestroyed: infrastructureMatch ? parseInt(infrastructureMatch[1]) : 0,
    };
}

const unitTypes = ["soldiers", "tanks"];
const battleDetails = extractBattleDetails(text, unitTypes);

console.log(JSON.stringify(battleDetails, null, 2));

if (false) {
try {
// All pages
    captcha();

    // and pw page
    if (urlMatches(/politicsandwar\.com/)) {
        addDefaultStyles();
    }

// War Declaration page
    if (urlMatches(/politicsandwar\.com\/nation\/war\/declare/)) {
        handleWarType();
        handleRedirect();
    }

// Bank page
// *politicsandwar.com/alliance/id=*&display=bank
    if (urlMatches(/politicsandwar\.com\/alliance\/id=\d+&display=bank/)) {
        initBankScripts();
    }

// War page
// *politicsandwar.com/nation/war/
    if (urlMatches(/politicsandwar\.com\/nation\/war/)) {
        initWarsPage();
    }
} catch (e) {
    console.error(e);
}
}