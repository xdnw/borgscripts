import {urlMatches} from './lib'
import {captcha} from "./captcha";
import {handleRedirect, handleWarType} from "./declare";
import {initBankScripts} from "./bank";
import {initWarsPage} from "./wars";
import {addDefaultStyles} from "./style";

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
} catch (e) {
    console.error(e);
}
