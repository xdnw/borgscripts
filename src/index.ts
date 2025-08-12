import { urlMatches } from './lib'
import { captcha } from "./captcha";
import { handleWarType } from "./declare";
import { initBankScripts } from "./bank";
import { initWarsPage } from "./wars";
import { addDefaultStyles } from "./style";
import { cacheProjects } from "./projects";
import { addBulkPurchase } from "./vip";
import handleEspionage from './espionage';

try {
    let newCSS = GM_getResourceText("jqueryui");
    GM_addStyle(newCSS);
    require('webpack-jquery-ui/dialog');

    // All pages
    captcha();

    // and pw page
    if (urlMatches(/politicsandwar\.com/)) {
        addDefaultStyles();
    }

    // War Declaration page
    if (urlMatches(/politicsandwar\.com\/nation\/war\/declare\/id=[0-9]+/)) {
        handleWarType();
    }

    // Bank page
    // *politicsandwar.com/alliance/id=*&display=bank
    if (urlMatches(/politicsandwar\.com\/alliance\/id=\d+&display=bank/)) {
        initBankScripts();
    }

    // War page
    // *politicsandwar.com/nation/war/
    if (urlMatches(/politicsandwar\.com\/nation\/war\/?$/)) {
        initWarsPage();
    }

    if (urlMatches(/politicsandwar\.com\/nation\/id=[0-9]+$/)) {
        cacheProjects(document, window.location.href);
    }

    if (urlMatches(/politicsandwar.com\/cities\/$/)) {
        addBulkPurchase();
    }
    // espionage tools
    // https://politicsandwar.com/battlesim/espionage/
    if (urlMatches(/politicsandwar\.com\/battlesim\/espionage\//)) {
        handleEspionage();
    }
} catch (e) {
    console.error(e);
}
