export function initWarsPage() {
    const url = "/index.php?id=15&amp;keyword=1725.26&amp;cat=war_range&amp;ob=score&amp;od=ASC&amp;maximum=15&amp;minimum=0&amp;search=Go&amp;beige=true&amp;vmode=false&amp;openslots=true";
    // find a href with the above url

    initMyUnits();
}

type CardInfo = {
    self: CardSide;
    other: CardSide;
}

type CardSide = {
    name: string;
    nation_id: number;
    alliance_id: number;
    alliance_name: string;
    soldier: number;
    tank: number;
    aircraft: number;
    ship: number;
    missile: number;
    nuke: number;
    resistance: number;
    map: number;
}

function parseUnits() {
    const cards: CardInfo[] = [];
    document.querySelectorAll('.pw-card').forEach(card => {
        const selfUnits = parseCardSide(card, false);
        const opponentUnits = parseCardSide(card, true);
        cards.push({ self: selfUnits, other: opponentUnits });
    });
    return cards;
}

function parseCardSide(card: Element, side: boolean): CardSide {
    let nation_id = -1;
    let name = 'Unknown';
    let alliance_id = -1;
    let alliance_name = 'Unknown';
    let resistance = -1;
    let map = -1;
    let soldier = -1;
    let tank = -1;
    let aircraft = -1;
    let ship = -1;
    let missile = -1;
    let nuke = -1;

    const o = side ? 0 : 1;
    const sideElements = card.querySelectorAll('.grid.grid-cols-2.gap-2');
    console.log("Side elements");
    console.log(sideElements);
    { // nation
        console.log("Nation children");
        console.log(sideElements[4].children);
        const natLink = sideElements[4].children[o];
        nation_id = parseInt(natLink.getAttribute('href')!.split('=')[1]);
        name = natLink.textContent!.trim();
    }
    { // alliance
        const allLink = sideElements[6].children[o];
        // if not A tag, then no alliance, set to 0 and None
        if (allLink.tagName === 'A') {
            alliance_id = parseInt(allLink.getAttribute('href')!.split('=')[1]);
            alliance_name = allLink.textContent!.trim();
        } else {
            alliance_id = 0;
            alliance_name = 'None';
        }
    }
    { // resistance
        const resDiv = sideElements[8].children[o];
        const resText = resDiv.textContent!.trim();
        const [res, resMax] = resText.split('/');
        resistance = parseInt(res);
    }
    { // map
        const mapDiv = sideElements[10].children[o];
        const mapText = mapDiv.textContent!.trim();
        const [mapCur, mapMax] = mapText.split('/');
        map = parseInt(mapCur);
    }
    { // units
        const unitDiv = sideElements[12].children[o];
        const unitIcons = unitDiv.querySelectorAll('.pw-tooltip-content');
        soldier = parseInt(unitIcons[0].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        tank = parseInt(unitIcons[1].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        aircraft = parseInt(unitIcons[2].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        ship = parseInt(unitIcons[3].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        missile = parseInt(unitIcons[4].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
        nuke = parseInt(unitIcons[5].textContent!.trim().split(' ')[0].trim().replace(/,/g, ''));
    }

    return { name, nation_id, alliance_id, alliance_name, soldier, tank, aircraft, ship, missile, nuke, resistance, map };
}

function initMyUnits() {
    console.log("Parsing units")
    // parse units, if present
    const cards: CardInfo[] = parseUnits();
    console.log(cards);
/*
<div class="pw-card">

            <div class="grid grid-cols-2 gap-2">
                <p class="pw-title-xs">War Type</p>
                <p class="pw-title-xs float-right text-right">Start Date</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
                        <div class="inline-flex text-xl items-center gap-0.5 !text-base">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-sword" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z"></path>   <path d="M6.5 11.5l6 6"></path>
</svg>            </div>
            Raid        </div>
                <p class="mb-0 flex items-center float-right text-right ml-auto">
                    01/26/2025 04:18 AM                </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <p class="pw-title-xs">You</p>
                <p class="pw-title-xs float-right text-right">Opponent</p>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-0.5">
                <div class="flex items-center justify-center">
                    <img class="max-w-[65%] mr-auto" src="https://politicsandwar.com/img/flags/betsy_ross.jpg" alt="Your flag">
                            <span class="group pw-tooltip mr-auto stroke-red-500" aria-describedby="tooltip_6796a8d9050a6">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-sword" width="36" height="36" viewBox="0 0 24 24" stroke-width="2" stroke="inherit" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z"></path>   <path d="M6.5 11.5l6 6"></path>
</svg>            <div class="pw-tooltip-content" id="tooltip_6796a8d9050a6" role="tooltip">
                You are attacking                <!-- <script>
                    $('#tooltip_6796a8d9050a6').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9050a6');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </span>
                </div>
                <div class="flex items-center justify-center">
                            <span class="group pw-tooltip ml-auto stroke-blue-500" aria-describedby="tooltip_6796a8d9050de">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-shield" width="36" height="36" viewBox="0 0 24 24" stroke-width="2" stroke="inherit" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3"></path>
</svg>            <div class="pw-tooltip-content" id="tooltip_6796a8d9050de" role="tooltip">
                Opponent is defending                <!-- <script>
                    $('#tooltip_6796a8d9050de').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9050de');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </span>
                    <img class="max-w-[65%] float-right text-right ml-auto" src="https://test.politicsandwar.com/uploads/288d94ffceb63dfa819ebc03d710a9deb8d45bfa938x600918.jpg" alt="Opponent's flag">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-0.5">
                <a href="/nation/id=702571" class="wrap-anywhere
                ">borfg</a>
                <a href="/nation/id=701060" class="float-right text-right wrap-anywhere">Velakryian Empire</a>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-0.5">
                <p class="wrap-anywhere">dddd</p>
                <p class="float-right text-right wrap-anywhere">Chara Vela Arch</p>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-0.5">
                                            <a href="/alliance/id=1623" class="text-base inline-flex items-center gap-[0.125rem] wrap-anywhere mr-auto leading-tight">
            <img src="https://politicsandwar.com/img/flags/betsy_ross.jpg" alt="Your alliance flag" class="h-4 align-middle">
            dsadas        </a>
                                                    <p class="mb-0 float-right text-right wrap-anywhere">No Alliance</p>
                            </div>


            <div class="grid grid-cols-2 gap-2 mt-0.5">
                <p class="pw-title-xs">Resistance</p>
                <p class="pw-title-xs float-right text-right">Opponent's Resistance</p>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-0.5">
                        <div class="w-full h-5 bg-zinc-200 dark:bg-zinc-700 rounded relative items-center ">
                        <div class="absolute h-full rounded bg-emerald-400 dark:bg-emerald-600 " style="width:100%;"></div>

                        <div class="absolute text-xs font-bold items-center justify-center flex leading-none px-2 h-full  " style="">
                100/100            </div>
        </div>
                        <div class="w-full h-5 bg-zinc-200 dark:bg-zinc-700 rounded relative items-center ">
                        <div class="absolute h-full rounded bg-emerald-400 dark:bg-emerald-600 left-full -translate-x-full" style="width:100%;"></div>

                        <div class="absolute text-xs font-bold items-center justify-center flex leading-none px-2 h-full -translate-x-full  left-full " style="">
                100/100            </div>
        </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-0.5">
                <p class="pw-title-xs">MAPs</p>
                <p class="pw-title-xs float-right text-right">Opponent's MAPs</p>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-0.5">
                        <div class="w-full h-5 bg-zinc-200 dark:bg-zinc-700 rounded relative items-center ">
                        <div class="absolute h-full rounded bg-red-400 dark:bg-red-600 " style="width:100%;"></div>

                        <div class="absolute text-xs font-bold items-center justify-center flex leading-none px-2 h-full  " style="">
                12/12            </div>
        </div>
                        <div class="w-full h-5 bg-zinc-200 dark:bg-zinc-700 rounded relative items-center ">
                        <div class="absolute h-full rounded bg-red-400 dark:bg-red-600 left-full -translate-x-full" style="width:100%;"></div>

                        <div class="absolute text-xs font-bold items-center justify-center flex leading-none px-2 h-full -translate-x-full  left-full " style="">
                12/12            </div>
        </div>
            </div>

            <p class="pw-title-xs flex items-center justify-center mt-0.5">Turns Left</p>
            <div class="mt-0.5">
                        <span class="group pw-tooltip " aria-describedby="tooltip_6796a8d905232">
                    <div class="w-full h-5 bg-zinc-200 dark:bg-zinc-700 rounded relative items-center ">
                        <div class="absolute h-full rounded bg-emerald-400 dark:bg-emerald-600 " style="width:71.666666666667%;"></div>

                        <div class="absolute text-xs font-bold items-center justify-center flex leading-none px-2 h-full -translate-x-1/2 left-1/2 " style="">
                43/60            </div>
        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d905232" role="tooltip">
                01/28/2025 04:00 PM                <!-- <script>
                    $('#tooltip_6796a8d905232').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d905232');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </span>
            </div>

            <div class="grid grid-cols-2 gap-2 my-0.5">
                <p class="pw-title-xs">Units</p>
                <p class="pw-title-xs float-right text-right">Opponent's Units</p>
            </div>
                        <div class="grid grid-cols-2 gap-2">
                <div class="grid grid-cols-2 gap-2">
                    <div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d90529b">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-badges" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M17 17v-4l-5 3l-5 -3v4l5 3z"></path>   <path d="M17 8v-4l-5 3l-5 -3v4l5 3z"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d90529b" role="tooltip">
                0 soldiers                <!-- <script>
                    $('#tooltip_6796a8d90529b').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d90529b');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d9052cb">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plane-tilt" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M14.5 6.5l3 -2.9a2.05 2.05 0 0 1 2.9 2.9l-2.9 3l2.5 7.5l-2.5 2.55l-3.5 -6.55l-3 3v3l-2 2l-1.5 -4.5l-4.5 -1.5l2 -2h3l3 -3l-6.5 -3.5l2.5 -2.5l7.5 2.5z"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d9052cb" role="tooltip">
                0 aircraft                <!-- <script>
                    $('#tooltip_6796a8d9052cb').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9052cb');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d9052f9">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-rocket" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"></path>   <path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3"></path>   <path d="M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d9052f9" role="tooltip">
                0 missiles                <!-- <script>
                    $('#tooltip_6796a8d9052f9').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9052f9');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                    </div>
                    <div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d90532a">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-tank" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M2 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v0a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"></path>   <path d="M6 12l1 -5h5l3 5"></path>   <path d="M21 9l-7.8 0"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d90532a" role="tooltip">
                0 tanks                <!-- <script>
                    $('#tooltip_6796a8d90532a').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d90532a');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d905356">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-ship" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1"></path>   <path d="M4 18l-1 -5h18l-2 4"></path>   <path d="M5 13v-6h8l4 6"></path>   <path d="M7 7v-4h-1"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d905356" role="tooltip">
                0 ships                <!-- <script>
                    $('#tooltip_6796a8d905356').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d905356');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d905381">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-radioactive" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M13.5 14.6l3 5.19a9 9 0 0 0 4.5 -7.79h-6a3 3 0 0 1 -1.5 2.6"></path>   <path d="M13.5 9.4l3 -5.19a9 9 0 0 0 -9 0l3 5.19a3 3 0 0 1 3 0"></path>   <path d="M10.5 14.6l-3 5.19a9 9 0 0 1 -4.5 -7.79h6a3 3 0 0 0 1.5 2.6"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d905381" role="tooltip">
                0 nukes                <!-- <script>
                    $('#tooltip_6796a8d905381').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d905381');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 float-right text-right">
                    <div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d9053b2">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm flex-row-reverse">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-tank" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M2 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v0a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"></path>   <path d="M6 12l1 -5h5l3 5"></path>   <path d="M21 9l-7.8 0"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d9053b2" role="tooltip">
                0 tanks                <!-- <script>
                    $('#tooltip_6796a8d9053b2').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9053b2');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d9053bf">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm flex-row-reverse">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-ship" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1"></path>   <path d="M4 18l-1 -5h18l-2 4"></path>   <path d="M5 13v-6h8l4 6"></path>   <path d="M7 7v-4h-1"></path>
</svg>            </div>
            101        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d9053bf" role="tooltip">
                101 ships                <!-- <script>
                    $('#tooltip_6796a8d9053bf').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9053bf');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d9053c6">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm flex-row-reverse">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-radioactive" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M13.5 14.6l3 5.19a9 9 0 0 0 4.5 -7.79h-6a3 3 0 0 1 -1.5 2.6"></path>   <path d="M13.5 9.4l3 -5.19a9 9 0 0 0 -9 0l3 5.19a3 3 0 0 1 3 0"></path>   <path d="M10.5 14.6l-3 5.19a9 9 0 0 1 -4.5 -7.79h6a3 3 0 0 0 1.5 2.6"></path>
</svg>            </div>
            3        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d9053c6" role="tooltip">
                3 nukes                <!-- <script>
                    $('#tooltip_6796a8d9053c6').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9053c6');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                    </div>
                    <div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d9053cc">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm flex-row-reverse">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-badges" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M17 17v-4l-5 3l-5 -3v4l5 3z"></path>   <path d="M17 8v-4l-5 3l-5 -3v4l5 3z"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d9053cc" role="tooltip">
                0 soldiers                <!-- <script>
                    $('#tooltip_6796a8d9053cc').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9053cc');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d9053d2">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm flex-row-reverse">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-plane-tilt" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M14.5 6.5l3 -2.9a2.05 2.05 0 0 1 2.9 2.9l-2.9 3l2.5 7.5l-2.5 2.55l-3.5 -6.55l-3 3v3l-2 2l-1.5 -4.5l-4.5 -1.5l2 -2h3l3 -3l-6.5 -3.5l2.5 -2.5l7.5 2.5z"></path>
</svg>            </div>
            0        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d9053d2" role="tooltip">
                0 aircraft                <!-- <script>
                    $('#tooltip_6796a8d9053d2').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9053d2');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                                <div class="group pw-tooltip " aria-describedby="tooltip_6796a8d9053d7">
                    <div class="inline-flex text-xl items-center gap-0.5 !text-sm flex-row-reverse">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-rocket" width="16" height="16" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"></path>   <path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3"></path>   <path d="M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
</svg>            </div>
            14        </div>
            <div class="pw-tooltip-content" id="tooltip_6796a8d9053d7" role="tooltip">
                14 missiles                <!-- <script>
                    $('#tooltip_6796a8d9053d7').ready(function() {
                        let el = document.getElementById('tooltip_6796a8d9053d7');
                        let rect = el.getBoundingClientRect();
                        if (rect.x < 0) {
                            el.style.marginLeft = `${-rect.x}px`;
                        } else if (rect.x + rect.width > window.innerWidth) {
                            el.style.marginLeft = `${window.innerWidth - rect.x - rect.width}px`;
                        }
                        if (rect.y < 0) {
                            el.style.marginTop = `${-rect.y}px`;
                        } else if (rect.y + rect.height > window.innerHeight) {
                            el.style.marginTop = `${window.innerHeight - rect.y - rect.height}px`;
                        }
                    })
                </script> -->
            </div>
        </div>
                    </div>
                </div>
            </div>
                                    <hr class="my-2 border-0 border-t-[1px] border-solid border-t-zinc-200">
                        <select id="select_action-163812" class="pw-select ">
            <option value="" selected="">Select an option</option>
                            <option value="/nation/war/groundbattle/war=163812">Ground Battle (3 MAPs)</option>
                            <option value="/nation/war/airstrike/war=163812">Airstrike (4 MAPs)</option>
                            <option value="/nation/war/navalbattle/war=163812">Naval Battle (4 MAPs)</option>
                            <option value="/nation/war/missile/war=163812">Launch Missile (8 MAPs)</option>
                            <option value="/nation/war/nuke/war=163812">Launch Nuke (12 MAPs)</option>
                            <option value="/nation/war/fortify/war=163812">Fortify (3 MAPs)</option>
                            <option value="/nation/espionage/eid=701060">Espionage (0 MAPs)</option>
                            <option value="/nation/war/peace/war=163812">Offer Peace</option>
                    </select>
                <script type="text/javascript">
                    $('#select_action-163812').on('change', function() {
                        var url = $(this).val();
                        if (url) {
                            window.location = url;
                        }
                        return false;
                    });
                </script>
                                <hr class="my-2 border-0 border-t-[1px] border-solid border-t-zinc-200">
                    <a href="/nation/war/timeline/war=163812" class="inline-flex text-xl items-center gap-0.5 text-white hover:text-gray-100 focus:text-gray-200
    bg-blue-600 hover:bg-blue-700 active:bg-blue-800 justify-center rounded py-2 px-3
    typically:no-underline w-full">
            <div class="flex items-center justify-center flex-row">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-hourglass" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>   <path d="M6.5 7h11"></path>   <path d="M6.5 17h11"></path>   <path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z"></path>   <path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z"></path>
</svg>            </div>
            War Timeline        </a>
        </div>
 */
}