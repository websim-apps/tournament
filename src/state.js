import { CONFIG, STATE } from './config.js';

function saveGame(data) {
    localStorage.setItem("gameSaveData", JSON.stringify(data));
    console.log("Game data saved to localStorage");
}

function loadGame() {
    const saveData = localStorage.getItem("gameSaveData");
    if (saveData) {
        const parsedData = JSON.parse(saveData);
        STATE.participantNames = new Map(parsedData.participantNames);
        CONFIG.matches = parsedData.matches;
        CONFIG.state = parsedData.state;
        const participantCountInput = document.getElementById("participantCount");
        if (participantCountInput) {
            participantCountInput.value = parsedData.participantCount;
        }
        document.getElementById("stateSwitch").checked = parsedData.state === "Running";
        document.getElementById("stateLabel").textContent = parsedData.state;
        console.log("Saved data loaded from localStorage");
        return true;
    } else {
        console.log("No saved data found in localStorage");
        return false;
    }
}

export function saveData() {
    const participantCountInput = document.getElementById("participantCount");
    const dataToSave = {
        participantNames: Array.from(STATE.participantNames.entries()),
        matches: CONFIG.matches.map((match) => ({
            ...match,
            topScore: match.topScore,
            bottomScore: match.bottomScore,
        })),
        state: CONFIG.state,
        participantCount: participantCountInput ? parseInt(participantCountInput.value) : CONFIG.minParticipants,
    };
    saveGame(dataToSave);
    console.log("Data autosaved");
}

export function loadSavedData() {
    return loadGame();
}

export function resetAllData() {
    STATE.participantNames = new Map();
    CONFIG.matches = [];
    CONFIG.state = "Configuration";
    document.getElementById("participantCount").value = "";
    document.getElementById("stateSwitch").checked = false;
    document.getElementById("stateLabel").textContent = "Configuration";
    document.getElementById("bracket").innerHTML = "";
    document.getElementById("error").textContent = "";
    
    const existingSvg = document.querySelector("svg");
    if (existingSvg) {
        existingSvg.remove();
    }
    
    saveData();
    console.log("All data reset");
}

export function resetMatchProgress() {
    CONFIG.matches.forEach((match) => {
        match.topScore = null;
        match.bottomScore = null;
        if (match.topPrecedingMatchId) {
            match.topParticipantID = null;
        }
        if (match.bottomPrecedingMatchId) {
            match.bottomParticipantID = null;
        }
    });
    saveData();
    console.log("Match progress reset");
}

export function getParticipantName(id) {
    return STATE.participantNames.get(id) || `Participant #${id}`;
}
