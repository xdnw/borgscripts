import {urlMatches} from './lib'
import {captcha} from "./captcha";
import {handleRedirect, handleWarType} from "./declare";

// All pages
captcha();

// War Declaration page
if (urlMatches(/politicsandwar\.com\/nation\/war\/declare/)) {
    handleWarType();
    handleRedirect();
}

// Bank page