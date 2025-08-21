import { CONFIG } from './config.js';
import { generateBracket } from './bracket.js';
import { handleResize, toggleState, updateUIBasedOnState, renderSavedBracket } from './ui.js';
import { saveData, loadSavedData, resetMatchProgress, resetAllData } from './state.js';

// --- INITIALIZATION ---

// Load saved data on page load
window.addEventListener("load", () => {
    if (loadSavedData()) {
        renderSavedBracket();
    }
    updateUIBasedOnState();
});

// Set up autosave
setInterval(saveData, CONFIG.autoSaveInterval);

// --- EVENT LISTENERS ---

document.getElementById("generateButton").addEventListener("click", generateBracket);
document.getElementById("stateSwitch").addEventListener("change", toggleState);
document.getElementById("saveButton").addEventListener("click", saveData);
document.getElementById("resetMatchProgressButton").addEventListener("click", () => {
    resetMatchProgress();
    renderSavedBracket();
});
document.getElementById("resetButton").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        resetAllData();
        updateUIBasedOnState();
    }
});
window.addEventListener("resize", handleResize);

// Initial UI update
updateUIBasedOnState();
