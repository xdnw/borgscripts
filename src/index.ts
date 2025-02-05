import {urlMatches} from './lib'
import {captcha} from "./captcha";
import {handleRedirect, handleWarType} from "./declare";
import {initBankScripts} from "./bank";
import {initWarsPage} from "./wars";
import {addDefaultStyles} from "./style";
import {cacheProjects} from "./projects";

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
    if (urlMatches(/politicsandwar\.com\/nation\/war/) && !urlMatches(/politicsandwar\.com\/nation\/war\/declare/)) {
        initWarsPage();
    }

    if (urlMatches(/politicsandwar\.com\/nation\/id=[0-9]+$/)) {
        cacheProjects(document, window.location.href);
    }
} catch (e) {
    console.error(e);
}
