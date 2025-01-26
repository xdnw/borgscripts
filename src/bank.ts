import $ from 'jquery';
const FEATURE_BANK_POLLING = false;

/*
Warchest
*/
function showNationWarchest() {
    let myPrompt = $(`<div id="nationDialog" title="Nation Warchest (json)">
<p>These are the amounts that will be kept on your nation:</p>
<br>
<form id="nation_wc_form">
  <textarea id="nationwarchestjson" form="nation_wc_form" placeholder="Enter code here..." rows="24" cols="50">{
	"depmoney": "0.00",
	"depcredits": "0.00",
	"depfood": "0.00",
	"depcoal": "0.00",
	"depoil": "0.00",
	"depuranium": "0.00",
	"deplead": "0.00",
	"depiron": "0.00",
	"depbauxite": "0.00",
	"depgasoline": "0.00",
	"depmunitions": "0.00",
	"depsteel": "0.00",
	"depaluminum": "0.00"
}</textarea>
  <br>
  <input type="submit" value="submit">
</form>
</div>`);

    $("body").after(myPrompt);

    $("#nation_wc_form").submit(function( event ) {
        try {
            let elems = JSON.parse($("#nationwarchestjson").val() as string);
            if (elems["depmoney"] != undefined) {
                GM_setValue("NATION_WARCHEST", elems);
                myPrompt.remove();
            } else {
                alert("Invalid input:\n" + elems)
            }
        } catch(err) {
            alert("Invalid input:\n" + err + "\n\n`" + $("#nationwarchestjson").val() + "`")
        }
        event.preventDefault();
    });

    myPrompt.dialog({
        width: 'auto'
    });

    let existingValue = GM_getValue("NATION_WARCHEST");
    if (existingValue != undefined) {
        console.log("Set nation warchest to \n" + JSON.stringify(existingValue, null, 2))
        $("#nationwarchestjson").val(JSON.stringify(existingValue, null, 2));
    }
}

function initNationWarchest() {
    let elem = $('<a href="javascript:void(0);" class="btn btn-default">Set Warchest</a>');
    $("[name='depsubmit']").parent().append("<br>");
    $("[name='depsubmit']").parent().append(elem);
    elem.click(showNationWarchest);
}

function showAllianceWarchest() {
    let myPrompt = $(`<div id="allianceDialog" title="Alliance Warchest (json)">
<p>These are the amounts that will be kept in the alliance bank:</p>
<br>
<form id="alliance_wc_form">
  <textarea id="alliancewarchestjson" form="alliance_wc_form" placeholder="Enter code here..." rows="24" cols="50">{
	"withmoney": "0.00",
	"withcredits": "0.00",
	"withfood": "0.00",
	"withcoal": "0.00",
	"withoil": "0.00",
	"withuranium": "0.00",
	"withlead": "0.00",
	"withiron": "0.00",
	"withbauxite": "0.00",
	"withgasoline": "0.00",
	"withmunitions": "0.00",
	"withsteel": "0.00",
	"withaluminum": "0.00"
}</textarea>
  <br>
  <input type="submit" value="submit">
</form>
</div>`);

    $("body").after(myPrompt);

    $("#alliance_wc_form").submit(function( event ) {
        try {
            let elems = JSON.parse($("#alliancewarchestjson").val() as string);
            if (elems["withmoney"] != undefined) {
                GM_setValue("ALLIANCE_WARCHEST", elems);
                myPrompt.remove();
            } else {
                alert("Invalid input:\n" + elems)
            }
        } catch(err) {
            alert("Invalid input:\n" + err + "\n\n`" + $("#alliancewarchestjson").val() + "`")
        }
        event.preventDefault();
    });

    myPrompt.dialog({
        width: 'auto'
    });

    let existingValue = GM_getValue("ALLIANCE_WARCHEST");
    if (existingValue != undefined) {
        console.log("Set alliance warchest to \n" + JSON.stringify(existingValue, null, 2))
        $("#alliancewarchestjson").val(JSON.stringify(existingValue, null, 2));
    }
}
function initAllianceWarchest() {
    let elem2 = $('<a href="javascript:void(0);" class="btn btn-default">Set Alliance Warchest</a>');
    $("[value='Withdraw']").parent().append("<br>");
    $("[value='Withdraw']").parent().append(elem2);
    elem2.click(showAllianceWarchest);
}

/*
Deposit all
*/
function initDepositAll() {
    let elem2 = $(`
<input type="button" name="withsubmit" class="big-submit btn-danger" style="background: #d9534f" value="Select Non WC">
`);
    $("[value='Withdraw']").parent().append(elem2);
    let withdrawals = $("#withdrawal").parent().parent().parent().find("input[type='text']");
    addDepositAll(elem2, withdrawals, "ALLIANCE_WARCHEST");


    let elem = $(`
<input type="button" name="depsubmit" class="big-submit btn-danger" style="background: #d9534f" value="Select Non WC">
`);
    $("[name='depsubmit']").parent().append(elem);
    let deposits = $("#deposit").parent().parent().parent().find("input[type='text']");
    addDepositAll(elem, deposits, "NATION_WARCHEST");


}

function addDepositAll(elem3, inputs, gm_key) {
    elem3.click(function( event ) {
        let warchest = GM_getValue(gm_key);
        if (warchest == undefined) warchest = {};
        try {
            event.preventDefault();
            inputs.each(function(index) {
                let name = $(this).attr("name");
                switch(name) {
                    case "depnote":
                    case "withtype":
                    case "withrecipient":
                    case "withnote":
                        return;
                }

                let text = $(this).parent().prev().text();
                let amt = parseFloat(text.substr(text.replace(",","").search("[0-9]"), text.length).replace(/,/g, ''));
                let wcValue = warchest[name]
                if (wcValue != undefined) {
                    amt = Math.max(0, amt - wcValue);
                }
                $(this).val(amt.toFixed(2));
            })
        } catch (e) {
            console.log(e);
        }
        console.log(inputs);
        console.log(inputs.length);
    });
}

/*
Add Disburse command
*/
let newCSS = GM_getResourceText ("jqueryui");
GM_addStyle (newCSS);

function disburse() {

    let myPrompt = $(`<div id="dialog" title="Disburse dialog">
<p>Please enter the code output by '!disburse'</p>
<br>
<form id="usrform">
  <textarea id="bankjson" form="usrform" placeholder="Enter code here..." rows="24" cols="50"></textarea>
  <br>
  <input type="submit" value="submit">
</form>
</div>`);

    $("body").after(myPrompt);

    $("#usrform").submit(function( event ) {
        try {
            let elems = JSON.parse($("#bankjson").val());
            if (elems.length > 0) {
                GM_setValue("BANK_SEND", elems);
                transfer();
            } else {
                alert("Invalid input:\n" + elems)
            }
        } catch(err) {
            alert("Invalid input:\n" + err + "\n\n`" + $("#bankjson").val() + "`")
        }
        event.preventDefault();
    });

    myPrompt.dialog({
        width: 'auto'
    });
}

function cancel() {
    GM_setValue("BANK_SEND", []);
    alert("Cancelled disburse");
}

function transfer() {
    let arr = GM_getValue("BANK_SEND", [])
    if (arr.length > 0) {
        console.log("Send " + JSON.stringify(arr));
        let data = arr.shift();
        if (data["withsubmit"]) {
            delete data["withsubmit"];
        }
        GM_setValue("BANK_SEND", arr);
        let url = window.location.href;
        let form = document.getElementById("formWithdrawal");
        for (const [key, value] of Object.entries(data)) {
            console.log(`${key} ${value}`);
            document.getElementsByName(key)[0].value = value;
        }

        document.getElementById("btn_confirm_withdrawal").click();
        document.getElementById("submit_confirmation").click();
    }
}

function initDisburse() {
    let elem;
    let arr = GM_getValue("BANK_SEND", []);
    if (arr.length > 0) {
        elem = $('<a id="disburse" href="javascript:void(0);" class="btn btn-danger">Cancel Disburse</a>');
        $("a[href$='#available-resources']").parent().prepend(elem);
        elem.click(cancel);

        setTimeout(transfer, 1000);
    } else {
        elem = $('<a href="javascript:void(0);" class="btn btn-danger">Disburse</a>');
        $("a[href$='#available-resources']").parent().prepend(elem);
        elem.click(disburse);
    }
}

let serializeQuery = function(obj: { [key: string]: string }) {
    let str = [];
    for (let p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}

let REQUEST_URL = GM_getValue("REQUEST_URL", "https://locutus.link/bankrequests");
let CALLBACK_URL = GM_getValue("CALLBACK_URL", "https://locutus.link/bankcallback");
let BANK_POLLING_ENABLED = GM_getValue("BANK_POLLING_ENABLED", false);

function sendFundsTask(data: string) {
    if (data) {
        let transferInfo = JSON.parse(data);
        let token = transferInfo.token;
        let transfers = transferInfo.transfer;
        console.log("Transfer " + transfers);
        console.log("Transfer 2 " + JSON.stringify(transfers));
        if (!Array.isArray(transfers)) transfers = [transfers];
        let timestamp = transferInfo.timestamp;
        console.log(transfers);

        let lastTime = GM_getValue("BANK_REQUEST_MS", 0);
        if (timestamp < lastTime) {
            console.log("Error: Invalid timestamp: " + lastTime);
            return;
        }
        let now = Date.now();
        if (timestamp < now - 15 * 1000) {
            console.log("Error: Too old timestamp: " + lastTime);
            return;
        }
        let lastToken = GM_getValue("BANK_TOKEN", "");
        if (lastToken === token) {
            console.log("Error: Token is already set: " + lastToken);
            return;
        }
        // set token
        GM_setValue("BANK_TOKEN", token);
        GM_setValue("BANK_REQUEST_MS", timestamp);
        if (GM_getValue("BANK_TOKEN", "") !== token) {
            console.log("Error: Token not set correctly: " + lastToken + " != " + token);
            return;
        }
        if (GM_getValue("BANK_REQUEST_MS", "") !== timestamp) {
            console.log("Error: timestamp not set correctly: " + lastTime + " != " + timestamp);
            return;
        }
        GM_setValue("BANK_SEND", transfers);
        if (JSON.stringify(GM_getValue("BANK_SEND", [])) !== JSON.stringify(transfers)) {
            console.log("Error: transfers not set correctly: " + GM_getValue("BANK_SEND", "") + " != " + transfers);
            return;
        }
        GM_setValue("BANK_CALLBACK_TIME", now);
        GM_setValue("BANK_CALLBACK_TOKEN", token);
        console.log("sending " + token + " | " + transfers);
        location.replace(window.location.href);
    }
}

function configureBankListener() {
    let myPrompt = $(`<div id="bankDialog" title="Configure Bank API">
<p>Enabling this task will poll a url for bank transfers</p>
<br>
<form id="bankform">
  <div class="input-group input-group-sm mb-3">
  <div class="input-group-prepend">
    <span class="input-group-text" id="inputGroup-sizing-sm">Poll Url</span>
  </div>
  <input form="bankform" id="pollurl" type="text" class="form-control" aria-label="Small" aria-describedby="inputGroup-sizing-sm" value="${REQUEST_URL}" pattern="[Hh][Tt][Tt][Pp][Ss]?:\/\/(?:(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)(?:\.(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)*(?:\.(?:[a-zA-Z\u00a1-\uffff]{2,}))(?::\d{2,5})?(?:\/[^\s]*)?">
</div>
<p>
  <a class="btn btn-link btn-sm" data-toggle="collapse" href="#pollAccordion" role="button" aria-expanded="false" aria-controls="pollAccordion">
    Show API JSON Example ▾
  </a>
</p>
<div class="collapse" id="pollAccordion">
  <div class="card card-body">
    <pre><code>{
  &quot;token&quot;: &quot;4cd2c306-6a4f-11ed-a1eb-0242ac120002&quot;,
  &quot;timestamp&quot;: 1669112475000,
  &quot;transfer&quot;: [
    {
      &quot;withrecipient&quot;: &quot;Borg&quot;,
      &quot;withtype&quot;: &quot;Nation&quot;,
      &quot;withmoney&quot;: &quot;420.69&quot;,
      &quot;withnote&quot;: &quot;#ignore&quot;
    }
  ]
}</code></pre>
  </div>
</div>
<br>
<hr>
<br>
<div class="input-group input-group-sm mb-3">
  <div class="input-group-prepend">
    <span class="input-group-text" id="inputGroup-sizing-sm">Callback Url</span>
  </div>
  <input form="bankform" id="callbackurl" type="text" class="form-control" aria-label="Small" aria-describedby="inputGroup-sizing-sm" value="${CALLBACK_URL}" pattern="[Hh][Tt][Tt][Pp][Ss]?:\/\/(?:(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)(?:\.(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)*(?:\.(?:[a-zA-Z\u00a1-\uffff]{2,}))(?::\d{2,5})?(?:\/[^\s]*)?">
</div>
<p>
  <a class="btn btn-link btn-sm" data-toggle="collapse" href="#callbackAccordion" role="button" aria-expanded="false" aria-controls="callbackAccordion">
    Show Callback Example ▾
  </a>
</p>
<div class="collapse" id="callbackAccordion">
  <div class="card card-body">
    <pre><code>&lt;callback url&gt;?token=abc123&amp;result=You successfully transferred funds</code></pre>
  </div>
</div>
  <br>
  <input type="submit" value="Enable">
</form>
</div>`);

    $("body").after(myPrompt);

    $("#bankform").submit(function( event ) {
        try {
            GM_setValue("BANK_POLLING_ENABLED", false);
            // pollurl
            // callbackurl
            let pollUrlVal = $("#pollurl").val() as string;
            if (pollUrlVal.length > 0) {
                GM_setValue("REQUEST_URL", pollUrlVal);
                REQUEST_URL = pollUrlVal;
                transfer();
            } else {
                alert("Invalid Poll Url:\n" + pollUrlVal)
                return false;
            }
            let callbackUrlVal = $("#callbackurl").val() as string;
            if (callbackUrlVal.length > 0) {
                GM_setValue("CALLBACK_URL", callbackUrlVal);
                CALLBACK_URL = callbackUrlVal;
                transfer();
            } else {
                alert("Invalid Poll Url:\n" + pollUrlVal)
                return false;
            }
            GM_setValue("BANK_POLLING_ENABLED", true);
            BANK_POLLING_ENABLED = true;
            location.replace(window.location.href);

        } catch(err) {
            alert("Invalid input:\n" + err + "\n\n`" + $("#pollurl").val() + "`" + "\n\n`" + $("#callbackurl").val() + "`")
        }
        event.preventDefault();
    });

    myPrompt.dialog({
        width: 'auto'
    });


    // Poll endpoint
    // Callback endpoint
    // Description of the json format
}

function cancelBankListener() {
    GM_setValue("BANK_POLLING_ENABLED", false)
    BANK_POLLING_ENABLED = false;
    location.replace(window.location.href);
}

function initBankListener() {

    if (BANK_POLLING_ENABLED) {
        let elem = $('<a id="banklistener" href="javascript:void(0);" class="btn btn-warning" alt="poll the ">Disable Bank API</a>');
        $("a[href$='#available-resources']").parent().prepend(elem);
        elem.click(cancelBankListener);

        setTimeout(transfer, 1000);
    } else if (FEATURE_BANK_POLLING) {
        let elem2 = $('<a href="javascript:void(0);" class="btn btn-info">⚙️Configure Bank API</a>');
        $("a[href$='#available-resources']").parent().prepend(elem2);
        elem2.click(configureBankListener);
    }

    let result = document.getElementById("withdrawal-result");
    if (result) {
        let time = GM_getValue("BANK_CALLBACK_TIME", 0);
        let now = Date.now();
        if (time > now - 15 * 1000) {
            let token = GM_getValue("BANK_CALLBACK_TOKEN", "");
            GM_setValue("BANK_CALLBACK_TIME", 0);
            GM_setValue("BANK_CALLBACK_TOKEN", "");

            let queryString = serializeQuery({
                token: token,
                result: result.textContent
            });

            let url = CALLBACK_URL + "?" + queryString;

            console.log("Callback " + url);

            GM.xmlHttpRequest({
                method: "POST",
                url: url
            });


        }
    }
    let arr = GM_getValue("BANK_SEND", []);
    if (arr.length == 0) {
        console.log("Running fetch bank listener");
        pollBankRequests();
        console.log("Running fetch bank listener 2");
    }
}

function pollBankRequests() {
    let interval = 1 * 1000;
    let rerun = function() {
        console.log('Waiting ' + (interval / 1000) + ' seconds');
        setTimeout(pollBankRequests, interval);
    }

    if (BANK_POLLING_ENABLED) {
        GM.xmlHttpRequest({
            method: "GET",
            url: REQUEST_URL,
            onload: function(response) {
                sendFundsTask(response.responseText);
                rerun();
            },
            onabort: rerun,
            onerror: rerun,
            ontimeout: rerun
        });

        console.log("Sending AJAX request...");
    } else {
        setTimeout(pollBankRequests, 8000);
    }
}