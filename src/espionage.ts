export default function handleEspionage() {
    // Helper to restore option value from GM storage
    async function restoreOption(id: string) {
        const el = document.getElementById(id) as HTMLSelectElement | null;
        if (!el) return;
        const stored = await GM_getValue(`espionage_${id}`, el.value);
        el.value = stored;
        el.addEventListener('change', () => {
            GM_setValue(`espionage_${id}`, el.value);
        });
    }

    restoreOption('optype');
    restoreOption('level');
}
