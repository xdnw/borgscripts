import {addCheckboxWithGMVariable, qSelector, refererMatches, urlMatches} from "./lib";

export function captcha() {
    // Check domain
    const isPWPage = urlMatches(/^https:\/\/politicsandwar\.com/) || urlMatches(/^https:\/\/test.politicsandwar\.com/);
    if (!isPWPage) {
        if (!refererMatches(/^https:\/\/politicsandwar\.com/) && !refererMatches(/^https:\/\/test.politicsandwar\.com/)) {
            return;
        }
    }
    // end check domain

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
    var recaptchaLanguage = qSelector("html").getAttribute("lang");
    var audioUrl = "";
    var recaptchaInitialStatus = qSelector(RECAPTCHA_STATUS) ? (qSelector(RECAPTCHA_STATUS) as HTMLElement).innerText : ""
    var serversList = ["https://engageub.pythonanywhere.com","https://engageub1.pythonanywhere.com"];
    var latencyList = Array(serversList.length).fill(10000);

    function isHidden(el: HTMLElement) {
        return (el.offsetParent === null);
    }

    function runCaptchaSolver() {
        async function getTextFromAudio(URL: string) {
            var minLatency = 100000;
            var url = "";

            //Selecting the last/latest server by default if latencies are equal
            for(let k=0; k< latencyList.length;k++){
                if(latencyList[k] <= minLatency){
                    minLatency = latencyList[k];
                    url = serversList[k];
                }
            }

            requestCount = requestCount + 1;
            URL = URL.replace("recaptcha.net", "google.com");
            if(!recaptchaLanguage || recaptchaLanguage.length < 1) {
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
                onload: function(response) {
                    console.log("Response::" + response.responseText);
                    try {
                        if (response && response.responseText) {
                            var responseText = response.responseText;
                            // Validate Response for error messages or HTML elements
                            if (responseText == "0" || responseText.includes("<") || responseText.includes(">") || responseText.length < 2 || responseText.length > 50) {
                                // Invalid Response, Reload the captcha
                                console.log("Invalid Response. Retrying..");
                            } else if (
                                qSelector(AUDIO_SOURCE) && (qSelector(AUDIO_SOURCE) as HTMLImageElement).src && audioUrl == (qSelector(AUDIO_SOURCE) as HTMLImageElement).src &&
                                qSelector(AUDIO_RESPONSE) && !(qSelector(AUDIO_RESPONSE) as HTMLInputElement).value && qSelector(AUDIO_BUTTON).style.display == "none" &&
                                qSelector(VERIFY_BUTTON)
                            ) {
                                (qSelector(AUDIO_RESPONSE) as HTMLInputElement).value = responseText;
                                (qSelector(VERIFY_BUTTON) as HTMLButtonElement).click();
                            } else {
                                console.log("Could not locate text input box");
                            }
                            waitingForAudioResponse = false;
                        }
                    } catch(err) {
                        console.log(err);
                        console.log("Exception handling response. Retrying..");
                        waitingForAudioResponse = false;
                    }
                },
                onerror: function(e) {
                    console.log(e);
                    waitingForAudioResponse = false;
                },
                ontimeout: function() {
                    console.log("Response Timed out. Retrying..");
                    waitingForAudioResponse = false;
                },
            });
        }


        async function pingTest(url: string) {
            var start = new Date().getTime();
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data: "",
                timeout: 8000,
                onload: function(response) {

                    if(response && response.responseText && response.responseText=="0") {
                        var end = new Date().getTime();
                        var milliseconds = end - start;

                        // For large values use Hashmap
                        for(let i=0; i< serversList.length;i++){
                            if (url == serversList[i]) {
                                latencyList[i] = milliseconds;
                            }
                        }
                    }
                },
                onerror: function(e) {
                    console.log(e);
                },
                ontimeout: function() {
                    console.log("Ping Test Response Timed out for " + url);
                },
            });
        }

        if(qSelector(CHECK_BOX)){
            qSelector(CHECK_BOX).click();
        } else if(window.location.href.includes("bframe")){
            for(let i=0; i< serversList.length;i++){
                pingTest(serversList[i]);
            }
        }

        //Solve the captcha using audio
        var startInterval = setInterval(function() {
            try {
                if(!checkBoxClicked && qSelector(CHECK_BOX) && !isHidden(qSelector(CHECK_BOX))) {
                    //console.log("checkbox clicked");
                    qSelector(CHECK_BOX).click();
                    checkBoxClicked = true;
                }
                //Check if the captcha is solved
                if(qSelector(RECAPTCHA_STATUS) && (qSelector(RECAPTCHA_STATUS).innerText != recaptchaInitialStatus)) {
                    solved = true;
                    console.log("SOLVED");
                    clearInterval(startInterval);
                    GM_setValue('captchaSolved', true);
                }
                if(requestCount > MAX_ATTEMPTS) {
                    console.log("Attempted Max Retries. Stopping the solver");
                    solved = true;
                    clearInterval(startInterval);
                }
                if(!solved) {
                    if(qSelector(AUDIO_BUTTON) && !isHidden(qSelector(AUDIO_BUTTON)) && qSelector(IMAGE_SELECT)) {
                        // console.log("Audio button clicked");
                        qSelector(AUDIO_BUTTON).click();
                    }
                    if (
                        (!waitingForAudioResponse && qSelector(AUDIO_SOURCE) && (qSelector(AUDIO_SOURCE) as HTMLImageElement).src
                            && (qSelector(AUDIO_SOURCE) as HTMLImageElement).src.length > 0 && audioUrl == (qSelector(AUDIO_SOURCE) as HTMLImageElement).src
                            && qSelector(RELOAD_BUTTON)) ||
                        (qSelector(AUDIO_ERROR_MESSAGE) && qSelector(AUDIO_ERROR_MESSAGE).innerText.length > 0 && qSelector(RELOAD_BUTTON) &&
                            !(qSelector(RELOAD_BUTTON) as HTMLButtonElement).disabled)
                    ) {
                        (qSelector(RELOAD_BUTTON) as HTMLButtonElement).click();
                    } else if (
                        !waitingForAudioResponse && qSelector(RESPONSE_FIELD) && !isHidden(qSelector(RESPONSE_FIELD))
                        && !(qSelector(AUDIO_RESPONSE) as HTMLInputElement).value && qSelector(AUDIO_SOURCE) && (qSelector(AUDIO_SOURCE) as HTMLImageElement).src
                        && (qSelector(AUDIO_SOURCE) as HTMLImageElement).src.length > 0 && audioUrl != (qSelector(AUDIO_SOURCE) as HTMLImageElement).src
                        && requestCount <= MAX_ATTEMPTS
                    ) {
                        waitingForAudioResponse = true;
                        audioUrl = (qSelector(AUDIO_SOURCE) as HTMLImageElement).src;
                        getTextFromAudio(audioUrl);
                    } else {
                        // Waiting
                    }
                }
                //Stop solving when Automated queries message is shown
                if(qSelector(DOSCAPTCHA) && qSelector(DOSCAPTCHA).innerText.length > 0) {
                    console.log("Automated Queries Detected");
                    clearInterval(startInterval);
                }
            } catch(err) {
                console.log(err);
                console.log("An error occurred while solving. Stopping the solver.");
                clearInterval(startInterval);
            }
        }, 25);
    }

    // if the url matches *politicsandwar.com
    if (GM_getValue('captchaAutofillEnabled', false)) {
        GM_setValue('captchaSolved', false);
        runCaptchaSolver();
    }
    const hasCaptcha = qSelector('.g-recaptcha');
    if (!hasCaptcha) return;

    addCheckboxWithGMVariable(
        'captchaAutofillEnabled',
        'Captcha Autofill',
        (checked) => { // Click
            GM_setValue('captchaAutofillEnabled', checked);
        },
        (checked) => { /* nothing */ },
        hasCaptcha,
        true
    );

    if (!isPWPage) return;

    const form = document.querySelector('form');
    if (!form) return;
    const buttons = form.querySelectorAll('button');
    let lastButton = buttons[buttons.length - 1] as HTMLElement;
    const isHumanPage = urlMatches(/politicsandwar\.com\/human/);

    if (!lastButton) {
        if (!isHumanPage) return;
        lastButton = form.querySelector('input[type="submit"]') as HTMLElement;
    }

    if (!isHumanPage)
    { // Auto url
        const container = document.createElement('div');
        container.style.padding = '4px';
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
    }
    const isAutoDeclare = new URLSearchParams(window.location.search).get('auto') || isHumanPage;
    if (isAutoDeclare) {
        GM_addValueChangeListener('captchaSolved', (key, oldValue, newValue, remote) => {
            if (newValue) {
                lastButton.click();
            }
        });
    }
}