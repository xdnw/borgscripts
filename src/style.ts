export function addDefaultStyles() {
    GM_addStyle( `
.tailwind .bg-red-600 { background-color: #e53935; --tw-bg-opacity: 1; }
.hover\\:bg-red-700:hover { background-color: #d32f2f; --tw-bg-opacity: 1; }
.active\\:bg-red-800:active { background-color: #c62828; --tw-bg-opacity: 1; }
.tailwind .bg-orange-600 { background-color: #fb8c00; --tw-bg-opacity: 1; }
hover\\:bg-orange-700:hover { background-color: #f57c00; --tw-bg-opacity: 1; }
active\\:bg-orange-800:active { background-color: #ef6c00; --tw-bg-opacity: 1; }
.tailwind .bg-yellow-600 { background-color: #fdd835; --tw-bg-opacity: 1; }
.hover\\:bg-yellow-700:hover { background-color: #fbc02d; --tw-bg-opacity: 1; }
.active\\:bg-yellow-800:active { background-color: #f9a825; --tw-bg-opacity: 1; }
.tailwind .bg-green-600 { background-color: #43a047; --tw-bg-opacity: 1; }
.hover\\:bg-green-700:hover { background-color: #388e3c; --tw-bg-opacity: 1; }
.active\\:bg-green-800:active { background-color: #2e7d32; --tw-bg-opacity: 1; }
.hover-opacity:hover { opacity: 0.9; }
.active-opacity:active { opacity: 0.8; }
` );

}