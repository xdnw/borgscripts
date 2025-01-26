// ==UserScript==
// @name        Declare War
// @description War type in URL, default war type button, captcha autofill, captcha solver, auto declare war, war declare auto redirect
// @version     0.1
// @author      Borg
// @match       *://*politicsandwar.com/*
// @match       *://*/recaptcha/*
// @connect     engageub.pythonanywhere.com
// @connect     engageub1.pythonanywhere.com
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addValueChangeListener
// @grant       GM_xmlhttpRequest
// @icon        https://raw.githubusercontent.com/xdnw/lc_stats_svelte/refs/heads/main/static/favicon-large.webp
// @license     MIT
// @namespace   http://tampermonkey.net/
// @require     https://code.jquery.com/jquery-3.7.1.min.js
// @require     https://code.jquery.com/ui/1.14.1/jquery-ui.min.js
// @require     https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css
// @resource    jqueryui https://code.jquery.com/ui/1.14.1/themes/base/jquery-ui.css
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/captcha.ts":
/*!************************!*\
  !*** ./src/captcha.ts ***!
  \************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.captcha = captcha;
const lib_1 = __webpack_require__(/*! ./lib */ "./src/lib.ts");
function captcha() {
    var solved = false;
    var checkBoxClicked = false;
    var waitingForAudioResponse = false;
    //Node Selectors
    const CHECK_BOX = ".recaptcha-checkbox-border";
    const AUDIO_BUTTON = "#recaptcha-audio-button";
    const PLAY_BUTTON = ".rc-audiochallenge-play-button .rc-button-default";
    const AUDIO_SOURCE = "#audio-source";
    const IMAGE_SELECT = "#rc-imageselect";
    const RESPONSE_FIELD = ".rc-audiochallenge-response-field";
    const AUDIO_ERROR_MESSAGE = ".rc-audiochallenge-error-message";
    const AUDIO_RESPONSE = "#audio-response";
    const RELOAD_BUTTON = "#recaptcha-reload-button";
    const RECAPTCHA_STATUS = "#recaptcha-accessible-status";
    const DOSCAPTCHA = ".rc-doscaptcha-body";
    const VERIFY_BUTTON = "#recaptcha-verify-button";
    const MAX_ATTEMPTS = 5;
    var requestCount = 0;
    var recaptchaLanguage = (0, lib_1.qSelector)("html").getAttribute("lang");
    var audioUrl = "";
    var recaptchaInitialStatus = (0, lib_1.qSelector)(RECAPTCHA_STATUS) ? (0, lib_1.qSelector)(RECAPTCHA_STATUS).innerText : "";
    var serversList = ["https://engageub.pythonanywhere.com", "https://engageub1.pythonanywhere.com"];
    var latencyList = Array(serversList.length).fill(10000);
    function isHidden(el) {
        return (el.offsetParent === null);
    }
    function runCaptchaSolver() {
        function getTextFromAudio(URL) {
            return __awaiter(this, void 0, void 0, function* () {
                var minLatency = 100000;
                var url = "";
                //Selecting the last/latest server by default if latencies are equal
                for (let k = 0; k < latencyList.length; k++) {
                    if (latencyList[k] <= minLatency) {
                        minLatency = latencyList[k];
                        url = serversList[k];
                    }
                }
                requestCount = requestCount + 1;
                URL = URL.replace("recaptcha.net", "google.com");
                if (!recaptchaLanguage || recaptchaLanguage.length < 1) {
                    console.log("Recaptcha Language is not recognized");
                    recaptchaLanguage = "en-US";
                }
                console.log("Recaptcha Language is " + recaptchaLanguage);
                GM_xmlhttpRequest({
                    method: "POST",
                    url: url,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data: "input=" + encodeURIComponent(URL) + "&lang=" + recaptchaLanguage,
                    timeout: 60000,
                    onload: function (response) {
                        console.log("Response::" + response.responseText);
                        try {
                            if (response && response.responseText) {
                                var responseText = response.responseText;
                                // Validate Response for error messages or HTML elements
                                if (responseText == "0" || responseText.includes("<") || responseText.includes(">") || responseText.length < 2 || responseText.length > 50) {
                                    // Invalid Response, Reload the captcha
                                    console.log("Invalid Response. Retrying..");
                                }
                                else if ((0, lib_1.qSelector)(AUDIO_SOURCE) && (0, lib_1.qSelector)(AUDIO_SOURCE).src && audioUrl == (0, lib_1.qSelector)(AUDIO_SOURCE).src &&
                                    (0, lib_1.qSelector)(AUDIO_RESPONSE) && !(0, lib_1.qSelector)(AUDIO_RESPONSE).value && (0, lib_1.qSelector)(AUDIO_BUTTON).style.display == "none" &&
                                    (0, lib_1.qSelector)(VERIFY_BUTTON)) {
                                    (0, lib_1.qSelector)(AUDIO_RESPONSE).value = responseText;
                                    (0, lib_1.qSelector)(VERIFY_BUTTON).click();
                                }
                                else {
                                    console.log("Could not locate text input box");
                                }
                                waitingForAudioResponse = false;
                            }
                        }
                        catch (err) {
                            console.log(err);
                            console.log("Exception handling response. Retrying..");
                            waitingForAudioResponse = false;
                        }
                    },
                    onerror: function (e) {
                        console.log(e);
                        waitingForAudioResponse = false;
                    },
                    ontimeout: function () {
                        console.log("Response Timed out. Retrying..");
                        waitingForAudioResponse = false;
                    },
                });
            });
        }
        function pingTest(url) {
            return __awaiter(this, void 0, void 0, function* () {
                var start = new Date().getTime();
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data: "",
                    timeout: 8000,
                    onload: function (response) {
                        if (response && response.responseText && response.responseText == "0") {
                            var end = new Date().getTime();
                            var milliseconds = end - start;
                            // For large values use Hashmap
                            for (let i = 0; i < serversList.length; i++) {
                                if (url == serversList[i]) {
                                    latencyList[i] = milliseconds;
                                }
                            }
                        }
                    },
                    onerror: function (e) {
                        console.log(e);
                    },
                    ontimeout: function () {
                        console.log("Ping Test Response Timed out for " + url);
                    },
                });
            });
        }
        if ((0, lib_1.qSelector)(CHECK_BOX)) {
            (0, lib_1.qSelector)(CHECK_BOX).click();
        }
        else if (window.location.href.includes("bframe")) {
            for (let i = 0; i < serversList.length; i++) {
                pingTest(serversList[i]);
            }
        }
        //Solve the captcha using audio
        var startInterval = setInterval(function () {
            try {
                if (!checkBoxClicked && (0, lib_1.qSelector)(CHECK_BOX) && !isHidden((0, lib_1.qSelector)(CHECK_BOX))) {
                    //console.log("checkbox clicked");
                    (0, lib_1.qSelector)(CHECK_BOX).click();
                    checkBoxClicked = true;
                }
                //Check if the captcha is solved
                if ((0, lib_1.qSelector)(RECAPTCHA_STATUS) && ((0, lib_1.qSelector)(RECAPTCHA_STATUS).innerText != recaptchaInitialStatus)) {
                    solved = true;
                    console.log("SOLVED");
                    clearInterval(startInterval);
                    GM_setValue('captchaSolved', true);
                }
                if (requestCount > MAX_ATTEMPTS) {
                    console.log("Attempted Max Retries. Stopping the solver");
                    solved = true;
                    clearInterval(startInterval);
                }
                if (!solved) {
                    if ((0, lib_1.qSelector)(AUDIO_BUTTON) && !isHidden((0, lib_1.qSelector)(AUDIO_BUTTON)) && (0, lib_1.qSelector)(IMAGE_SELECT)) {
                        // console.log("Audio button clicked");
                        (0, lib_1.qSelector)(AUDIO_BUTTON).click();
                    }
                    if ((!waitingForAudioResponse && (0, lib_1.qSelector)(AUDIO_SOURCE) && (0, lib_1.qSelector)(AUDIO_SOURCE).src
                        && (0, lib_1.qSelector)(AUDIO_SOURCE).src.length > 0 && audioUrl == (0, lib_1.qSelector)(AUDIO_SOURCE).src
                        && (0, lib_1.qSelector)(RELOAD_BUTTON)) ||
                        ((0, lib_1.qSelector)(AUDIO_ERROR_MESSAGE) && (0, lib_1.qSelector)(AUDIO_ERROR_MESSAGE).innerText.length > 0 && (0, lib_1.qSelector)(RELOAD_BUTTON) &&
                            !(0, lib_1.qSelector)(RELOAD_BUTTON).disabled)) {
                        (0, lib_1.qSelector)(RELOAD_BUTTON).click();
                    }
                    else if (!waitingForAudioResponse && (0, lib_1.qSelector)(RESPONSE_FIELD) && !isHidden((0, lib_1.qSelector)(RESPONSE_FIELD))
                        && !(0, lib_1.qSelector)(AUDIO_RESPONSE).value && (0, lib_1.qSelector)(AUDIO_SOURCE) && (0, lib_1.qSelector)(AUDIO_SOURCE).src
                        && (0, lib_1.qSelector)(AUDIO_SOURCE).src.length > 0 && audioUrl != (0, lib_1.qSelector)(AUDIO_SOURCE).src
                        && requestCount <= MAX_ATTEMPTS) {
                        waitingForAudioResponse = true;
                        audioUrl = (0, lib_1.qSelector)(AUDIO_SOURCE).src;
                        getTextFromAudio(audioUrl);
                    }
                    else {
                        // Waiting
                    }
                }
                //Stop solving when Automated queries message is shown
                if ((0, lib_1.qSelector)(DOSCAPTCHA) && (0, lib_1.qSelector)(DOSCAPTCHA).innerText.length > 0) {
                    console.log("Automated Queries Detected");
                    clearInterval(startInterval);
                }
            }
            catch (err) {
                console.log(err);
                console.log("An error occurred while solving. Stopping the solver.");
                clearInterval(startInterval);
            }
        }, 200);
    }
    const gmVariable = 'captchaAutofillEnabled';
    const isAutofillEnabled = GM_getValue(gmVariable, false);
    if (isAutofillEnabled) {
        GM_setValue('captchaSolved', false);
        runCaptchaSolver();
    }
    // if the url matches *politicsandwar.com
    const isPWPage = (0, lib_1.urlMatches)(/politicsandwar.com/);
    if (!isPWPage)
        return;
    const hasCaptcha = (0, lib_1.qSelector)('.g-recaptcha');
    if (!hasCaptcha)
        return;
    const form = document.querySelector('form');
    if (!form)
        return;
    const buttons = form.querySelectorAll('button');
    const lastButton = buttons[buttons.length - 1];
    if (!lastButton)
        return;
    const toggleCheckbox = document.createElement('input');
    toggleCheckbox.type = 'checkbox';
    toggleCheckbox.checked = isAutofillEnabled;
    toggleCheckbox.id = 'captcha-autofill-toggle';
    const label = document.createElement('label');
    label.htmlFor = 'captcha-autofill-toggle';
    label.textContent = 'Enable Captcha Autofill';
    toggleCheckbox.addEventListener('change', () => {
        GM_setValue(gmVariable, toggleCheckbox.checked);
    });
    const container = document.createElement('div');
    container.appendChild(label);
    container.appendChild(toggleCheckbox);
    const info = document.createElement('p');
    info.innerHTML = 'Append <kbd>?auto=true</kbd> to the query string to submit when the captcha is solved';
    container.appendChild(info);
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Auto url';
    copyButton.className = 'pw-btn pw-btn-text-white pw-btn-blue';
    copyButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent form submission
        const url = new URL(window.location.href);
        url.searchParams.set('auto', 'true');
        navigator.clipboard.writeText(url.toString()).then(() => {
            alert('Copied Auto URL to clipboard');
        });
    });
    container.appendChild(copyButton);
    lastButton.insertAdjacentElement('beforebegin', container);
    const isAutoDeclare = new URLSearchParams(window.location.search).get('auto');
    if (isAutoDeclare) {
        GM_addValueChangeListener('captchaSolved', (key, oldValue, newValue, remote) => {
            if (newValue) {
                lastButton.click();
            }
        });
    }
}


/***/ }),

/***/ "./src/lib.ts":
/*!********************!*\
  !*** ./src/lib.ts ***!
  \********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.qSelector = qSelector;
exports.qSelectorAll = qSelectorAll;
exports.urlMatches = urlMatches;
function qSelector(selector) {
    return document.querySelector(selector);
}
function qSelectorAll(selector) {
    return document.querySelectorAll(selector);
}
function urlMatches(regex) {
    return regex.test(window.location.href);
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const captcha_1 = __webpack_require__(/*! ./captcha */ "./src/captcha.ts");
// All pages
(0, captcha_1.captcha)();
// // War Declaration page
// if (urlMatches(/politicsandwar\.com\/nation\/war\/declare/)) {
//     handleWarType();
//     handleRedirect();
// }
// Bank page

})();

/******/ })()
;
//# sourceMappingURL=locutus.js.map