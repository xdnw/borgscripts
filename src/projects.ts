import {get, urlMatches} from "./lib";

export const PROJECT_BITS: { [key: string]: number } = {
    'Iron Dome': 1,
    'Vital Defense System': 2,
    'Missile Launch Pad': 4,
    'Nuclear Research Facility': 8,
}
export function cacheProjects(doc: Document, url: string) {
    const projectElems = doc.querySelectorAll('img[src^="/img/projects/"]');
    const projects = [];
    for (const elem of projectElems) {
        const project = elem.getAttribute('alt')!.split('.')[0];
        projects.push(project);
    }
    const nationId = url.match(/nation\/id=([0-9]+)/)![1];
    let bits = 0;
    for (const project of projects) {
        if (PROJECT_BITS[project]) bits |= PROJECT_BITS[project];
    }
    const date = daysSinceJan1st2025();
    const bitsAndDate = bits | (date << 4);
    GM_setValue(`projects_${nationId}`, bitsAndDate);
    return bits;
}

function daysSinceJan1st2025() {
    const now = new Date();
    const jan1st2025 = new Date(2025, 0, 1);
    const diff = now.getTime() - jan1st2025.getTime();
    return diff / (1000 * 60 * 60 * 24);
}

export function getOrFetchProjects(nationId: number, fetchIfMissing: boolean, updateIfOlderThan: number): Promise<number | undefined> {
    const key = `projects_${nationId}`;
    const storedValue = GM_getValue(key, undefined);

    if (storedValue !== undefined) {
        const bits = storedValue & 0xF;
        const storedDate = storedValue >> 4;
        const currentDate = daysSinceJan1st2025();

        if (currentDate - storedDate < updateIfOlderThan) {
            return Promise.resolve(bits);
        }
    }

    if (!fetchIfMissing) {
        return Promise.resolve(storedValue ? storedValue & 0xF : undefined);
    }

    const url = window.location.origin + `/nation/id=${nationId}`;
    return get(url).then(doc => {
        return cacheProjects(doc, url);
    });
}

export function getOrFetchProjectsForAll(nationIds: number[], fetchIfMissing: boolean, updateIfOlderThan: number): Promise<{ [key: number]: number }> {
    const result: { [key: number]: number } = {};
    const promises = nationIds.map(nationId => {
        return getOrFetchProjects(nationId, fetchIfMissing, updateIfOlderThan).then(projects => {
            if (projects !== undefined) {
                result[nationId] = projects;
            }
        });
    });
    removeProjectsExcept(nationIds);
    return Promise.all(promises).then(() => result);
}

export function removeProjectsExcept(nationIds: number[]) {
    const set = new Set(nationIds);
    const keys = GM_listValues();
    for (const key of keys) {
        if (key.startsWith('projects_')) {
            const nationId = parseInt(key.split('_')[1]);
            if (!set.has(nationId)) {
                GM_deleteValue(key);
            }
        }
    }
}

export function removeAllProjects() {
    const keys = GM_listValues();
    for (const key of keys) {
        if (key.startsWith('projects_')) {
            GM_deleteValue(key);
        }
    }
}