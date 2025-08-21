const CONFIG = {
    minParticipants: 2, // Minimum number of participants
    maxParticipants: 64, // Maximum number of participants
    matchWidth: 200, // Width of each match box in pixels
    matchHeight: 80, // Height of each match box in pixels
    horizontalSpacing: 50, // Horizontal spacing between rounds in pixels
    lineColor: "#3498db", // Color of connecting lines
    svgNamespace: "http://www.w3.org/2000/svg", // SVG namespace
    state: "Configuration", // Current state of the application
    matches: [], // Array to store all matches
    autoSaveInterval: 30000, // Autosave interval in milliseconds
};

const STATE = {
  participantNames: new Map(), // Map to store participant names
};

// Load saved data on page load
window.addEventListener("load", loadSavedData);
// Set up autosave
setInterval(saveData, CONFIG.autoSaveInterval);

function saveData() {
    const dataToSave = {
        participantNames: Array.from(STATE.participantNames.entries()),
        matches: CONFIG.matches.map((match) => ({
            ...match,
            topScore: match.topScore,
            bottomScore: match.bottomScore,
        })),
        state: CONFIG.state,
        participantCount: parseInt(document.getElementById("participantCount").value),
    };
    saveGame(dataToSave);
    console.log("Data autosaved");
}

function loadSavedData() {
    loadGame();
}

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
        document.getElementById("participantCount").value = parsedData.participantCount;
        document.getElementById("stateSwitch").checked = parsedData.state === "Running";
        document.getElementById("stateLabel").textContent = parsedData.state;
        updateUIBasedOnState();
        renderSavedBracket();
        updateMatchScores();
        console.log("Saved data loaded from localStorage");
    } else {
        console.log("No saved data found in localStorage");
    }
}

function renderSavedBracket() {
    const bracketElement = document.getElementById("bracket");
    bracketElement.innerHTML = "";
    // Group matches by rounds
    const roundsMap = new Map();
    CONFIG.matches.forEach((match) => {
        const round = Math.floor(Math.log2(match.id));
        if (!roundsMap.has(round)) {
            roundsMap.set(round, []);
        }
        roundsMap.get(round).push(match);
    });
    // Render rounds
    const roundElements = [];
    roundsMap.forEach((roundMatches, round) => {
        const roundElement = document.createElement("div");
        roundElement.className = "round";
        // Sort matches based on their localIndex for all rounds
        roundMatches.sort((a, b) => a.localIndex - b.localIndex);
        if (round === roundsMap.size - 1) {
            // Last round (first matches)
            let lastLocalIndex = 0;
            roundMatches.forEach((match) => {
                // Add filler invisible matches
                for (let i = lastLocalIndex + 1; i < match.localIndex; i++) {
                    const invisibleMatch = document.createElement("div");
                    invisibleMatch.className = "invisible-match";
                    roundElement.appendChild(invisibleMatch);
                }
                const matchElement = createMatchElement(match);
                roundElement.appendChild(matchElement);
                lastLocalIndex = match.localIndex;
            });
            // Add remaining invisible matches if needed
            const maxLocalIndex = Math.pow(2, roundsMap.size - 1);
            for (let i = lastLocalIndex + 1; i <= maxLocalIndex; i++) {
                const invisibleMatch = document.createElement("div");
                invisibleMatch.className = "invisible-match";
                roundElement.appendChild(invisibleMatch);
            }
        } else {
            roundMatches.forEach((match) => {
                const matchElement = createMatchElement(match);
                roundElement.appendChild(matchElement);
            });
        }
        roundElements.push(roundElement);
    });
    // Add rounds to the bracket, starting from the first round (reversed order)
    roundElements.reverse().forEach((roundElement) => {
        bracketElement.appendChild(roundElement);
    });
    // Draw connecting lines between matches
    setTimeout(() => drawLines(CONFIG.matches), 0);
}

function updateMatchScores() {
    CONFIG.matches.forEach((match) => {
        const matchElement = document.getElementById(`match-${match.id}`);
        if (matchElement) {
            const topParticipantElement = matchElement.children[1];
            const bottomParticipantElement = matchElement.children[2];
            if (match.topScore !== null) {
                let topScoreElement = topParticipantElement.querySelector(".score");
                if (!topScoreElement) {
                    topScoreElement = document.createElement("span");
                    topScoreElement.className = "score";
                    topParticipantElement.appendChild(topScoreElement);
                }
                topScoreElement.textContent = match.topScore;
            }
            if (match.bottomScore !== null) {
                let bottomScoreElement = bottomParticipantElement.querySelector(".score");
                if (!bottomScoreElement) {
                    bottomScoreElement = document.createElement("span");
                    bottomScoreElement.className = "score";
                    bottomParticipantElement.appendChild(bottomScoreElement);
                }
                bottomScoreElement.textContent = match.bottomScore;
            }
        }
    });
}

function resetAllData() {
    STATE.participantNames = new Map();
    CONFIG.matches = [];
    CONFIG.state = "Configuration";
    document.getElementById("participantCount").value = "";
    document.getElementById("stateSwitch").checked = false;
    document.getElementById("stateLabel").textContent = "Configuration";
    document.getElementById("bracket").innerHTML = "";
    document.getElementById("error").textContent = "";
    updateUIBasedOnState();
    saveData(); // Save the reset state
    console.log("All data reset");
}

function resetMatchProgress() {
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
    renderSavedBracket();
    console.log("Match progress reset");
    saveData(); // Save the reset state
}
// Function to get participant name
function getParticipantName(id) {
    return STATE.participantNames.get(id) || `Participant #${id}`;
}
class Match {
    constructor(id, topParticipant, bottomParticipant, topScore, bottomScore, topPrecedingMatchId, bottomPrecedingMatchId, localIndex) {
        this.id = id;
        this.topParticipantID = topParticipant;
        this.bottomParticipantID = bottomParticipant;
        this.topScore = topScore;
        this.bottomScore = bottomScore;
        this.topPrecedingMatchId = topPrecedingMatchId;
        this.bottomPrecedingMatchId = bottomPrecedingMatchId;
        this.localIndex = localIndex;
    }
}

function createMatchElement(match) {
    const matchElement = document.createElement("div");
    matchElement.className = "match";
    matchElement.id = `match-${match.id}`;
    const matchNumberElement = document.createElement("div");
    matchNumberElement.className = "match-number";
    matchNumberElement.textContent = `Match ${match.id}`;
    matchElement.appendChild(matchNumberElement);
    const topParticipantElement = createParticipantElement(match.topParticipantID, match.topScore);
    const bottomParticipantElement = createParticipantElement(match.bottomParticipantID, match.bottomScore);
    matchElement.appendChild(topParticipantElement);
    matchElement.appendChild(bottomParticipantElement);
    return matchElement;
}

function createParticipantElement(participantId, score) {
    const participantElement = document.createElement("div");
    participantElement.className = "participant";
    if (participantId) {
        participantElement.textContent = getParticipantName(participantId);
        participantElement.dataset.participantId = participantId;
        participantElement.classList.add("editable");
        participantElement.addEventListener("click", handleParticipantClick);
    } else {
        participantElement.textContent = "TBD";
    }
    if (score !== null) {
        const scoreElement = document.createElement("span");
        scoreElement.className = "score";
        scoreElement.textContent = score;
        participantElement.appendChild(scoreElement);
    }
    return participantElement;
}

function updateParticipantNames() {
    const participants = document.querySelectorAll(".participant[data-participant-id]");
    participants.forEach((participant) => {
        const participantId = parseInt(participant.dataset.participantId);
        participant.textContent = getParticipantName(participantId);
    });
}

function handleParticipantClick(event) {
    if (CONFIG.state === "Configuration") {
        const participantElement = event.target;
        const participantId = participantElement.dataset.participantId;
        const currentName = getParticipantName(parseInt(participantId));
        const inputElement = document.createElement("input");
        inputElement.type = "text";
        inputElement.value = currentName;
        inputElement.className = "participant-input";
        inputElement.addEventListener("blur", () => handleParticipantNameChange(inputElement, participantId));
        inputElement.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                inputElement.blur();
            }
        });
        participantElement.textContent = "";
        participantElement.appendChild(inputElement);
        inputElement.focus();
        // Select the entire text in the input
        inputElement.select();
    } else if (CONFIG.state === "Running") {
        advanceParticipant(event.target);
    }
}

function handleParticipantNameChange(inputElement, participantId) {
    const newName = inputElement.value.trim();
    if (newName) {
        STATE.participantNames.set(parseInt(participantId), newName);
        console.log("Updated participantNames map:", new Map(STATE.participantNames));
    } else {
        // If the new name is empty, revert to the default name
        STATE.participantNames.set(parseInt(participantId), `Participant #${participantId}`);
    }
    const participantElement = inputElement.parentElement;
    participantElement.textContent = getParticipantName(parseInt(participantId));
    participantElement.classList.add("editable");
    participantElement.dataset.participantId = participantId;
}

function advanceParticipant(participantElement) {
    const matchElement = participantElement.closest(".match");
    const matchId = parseInt(matchElement.id.split("-")[1]);
    const match = CONFIG.matches.find((m) => m.id === matchId);
    if (!match) return;
    const isTopParticipant = participantElement === matchElement.children[1];
    const winningParticipantId = parseInt(participantElement.dataset.participantId);
    const losingParticipantId = isTopParticipant ? match.bottomParticipantID : match.topParticipantID;
    // Check if the opponent is TBD
    if (!losingParticipantId) {
        console.log("Cannot advance participant. Opponent is TBD.");
        return;
    }
    // Find the next match
    const nextMatch = CONFIG.matches.find((m) => m.topPrecedingMatchId === matchId || m.bottomPrecedingMatchId === matchId);
    if (nextMatch) {
        if (nextMatch.topPrecedingMatchId === matchId) {
            nextMatch.topParticipantID = winningParticipantId;
        } else {
            nextMatch.bottomParticipantID = winningParticipantId;
        }
        // Update the next match's element
        const nextMatchElement = document.getElementById(`match-${nextMatch.id}`);
        const nextParticipantElement = createParticipantElement(winningParticipantId, null);
        if (nextMatch.topPrecedingMatchId === matchId) {
            nextMatchElement.replaceChild(nextParticipantElement, nextMatchElement.children[1]);
        } else {
            nextMatchElement.replaceChild(nextParticipantElement, nextMatchElement.children[2]);
        }
    }
    // Update the current match
    if (isTopParticipant) {
        match.topScore = 1;
        match.bottomScore = 0;
    } else {
        match.topScore = 0;
        match.bottomScore = 1;
    }
    // Update the match element to reflect the scores
    const topScoreElement = matchElement.children[1].querySelector(".score") || document.createElement("span");
    topScoreElement.className = "score";
    topScoreElement.textContent = match.topScore;
    matchElement.children[1].appendChild(topScoreElement);
    const bottomScoreElement = matchElement.children[2].querySelector(".score") || document.createElement("span");
    bottomScoreElement.className = "score";
    bottomScoreElement.textContent = match.bottomScore;
    matchElement.children[2].appendChild(bottomScoreElement);
}

function drawLines(matches) {
    // Remove existing SVG if any
    const existingSvg = document.querySelector("svg");
    if (existingSvg) {
        existingSvg.remove();
    }
    const bracketElement = document.getElementById("bracket");
    const svg = document.createElementNS(CONFIG.svgNamespace, "svg");
    svg.style.position = "absolute";
    svg.style.top = bracketElement.offsetTop + "px";
    svg.style.left = bracketElement.offsetLeft + "px";
    svg.style.width = bracketElement.offsetWidth + "px";
    svg.style.height = bracketElement.offsetHeight + "px";
    svg.style.pointerEvents = "none";
    document.body.appendChild(svg);
    matches.forEach((match) => {
        if (match.topPrecedingMatchId) {
            drawLine(svg, `match-${match.topPrecedingMatchId}`, `match-${match.id}`, true);
        }
        if (match.bottomPrecedingMatchId) {
            drawLine(svg, `match-${match.bottomPrecedingMatchId}`, `match-${match.id}`, false);
        }
    });
}

function drawLine(svg, fromId, toId, isTop) {
    const fromElement = document.getElementById(fromId);
    const toElement = document.getElementById(toId);
    if (!fromElement || !toElement) {
        console.error(`Element not found. fromId: ${fromId}, toId: ${toId}`);
        console.log("fromElement:", fromElement);
        console.log("toElement:", toElement);
        return;
    }
    const bracketElement = document.getElementById("bracket");
    if (!bracketElement) {
        console.error("Bracket element not found");
        return;
    }
    const bracketRect = bracketElement.getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    const fromX = fromRect.right - bracketRect.left;
    const fromY = fromRect.top + toRect.height * 0.5 - bracketRect.top;
    const toX = toRect.left - bracketRect.left;
    const toY = toRect.top + (isTop ? fromRect.height * 0.25 : fromRect.height * 0.75) - bracketRect.top;
    const midX = (fromX + toX) / 2;
    const line = document.createElementNS(CONFIG.svgNamespace, "path");
    line.setAttribute("d", `M${fromX},${fromY} H${midX} V${toY} H${toX}`);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", CONFIG.lineColor);
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
    console.log(`Drawing line from ${fromId} to ${toId}:`, {
        fromX,
        fromY,
        toX,
        toY,
        midX,
        path: `M${fromX},${fromY} H${midX} V${toY} H${toX}`,
    });
}

function generateBracket() {
    if (CONFIG.state !== "Configuration") {
        console.log("Cannot generate bracket in Running state");
        return;
    }
    // Get the number of participants from the input field
    const participantCount = parseInt(document.getElementById("participantCount").value);
    const errorElement = document.getElementById("error");
    const bracketElement = document.getElementById("bracket");
    // Validate the number of participants
    if (isNaN(participantCount) || participantCount < CONFIG.minParticipants || participantCount > CONFIG.maxParticipants) {
        errorElement.textContent = `Please enter a valid number of participants (${CONFIG.minParticipants}-${CONFIG.maxParticipants}).`;
        return;
    }
    // Clear any previous error messages and bracket content
    errorElement.textContent = "";
    bracketElement.innerHTML = "";
    // Ensure participant names are set for all participants
    for (let i = 1; i <= participantCount; i++) {
        if (!STATE.participantNames.has(i)) {
            STATE.participantNames.set(i, `Participant #${i}`);
        }
    }
    // Remove any excess participant names
    for (let i = participantCount + 1; i <= CONFIG.maxParticipants; i++) {
        STATE.participantNames.delete(i);
    }
    CONFIG.matches = [];
    let matchId = 1;
    // Start with match 1 with participant IDs 1 and 2
    CONFIG.matches.push(new Match(matchId, 1, 2, null, null, null, null, 1));
    console.log(`Generated match: ID ${matchId}, Participants: 1, 2, LocalIndex: 1`);
    // Generate matches until we reach the desired number
    while (CONFIG.matches.length < participantCount - 1) {
        matchId++;
        const correspondingParticipantId = Math.pow(2, Math.floor(Math.log2(matchId) + 1)) - matchId;
        const correspondingMatch = CONFIG.matches.find((m) => m.topParticipantID === correspondingParticipantId || m.bottomParticipantID === correspondingParticipantId);
        if (correspondingMatch) {
            let localIndex;
            if (correspondingMatch.topParticipantID === correspondingParticipantId) {
                correspondingMatch.topPrecedingMatchId = matchId;
                correspondingMatch.topParticipantID = null;
                localIndex = correspondingMatch.localIndex * 2 - 1;
            } else {
                correspondingMatch.bottomPrecedingMatchId = matchId;
                correspondingMatch.bottomParticipantID = null;
                localIndex = correspondingMatch.localIndex * 2;
            }
            CONFIG.matches.push(new Match(matchId, correspondingParticipantId, matchId + 1, null, null, null, null, localIndex));
            console.log(`Generated match: ID ${matchId}, Participants: ${correspondingParticipantId}, ${matchId + 1}, LocalIndex: ${localIndex}`);
            console.log(`Updated match: ID ${correspondingMatch.id}, Preceding matches: ${correspondingMatch.topPrecedingMatchId}, ${correspondingMatch.bottomPrecedingMatchId}`);
        }
    }
    // Assign matches to rounds
    const roundsMap = new Map();
    let currentRound = 0;
    let currentRoundMatches = [CONFIG.matches[0]]; // Start with the final match
    while (currentRoundMatches.length > 0) {
        roundsMap.set(currentRound, currentRoundMatches);
        const nextRoundMatches = [];
        for (const match of currentRoundMatches) {
            if (match.topPrecedingMatchId !== null) {
                nextRoundMatches.push(CONFIG.matches.find((m) => m.id === match.topPrecedingMatchId));
            }
            if (match.bottomPrecedingMatchId !== null) {
                nextRoundMatches.push(CONFIG.matches.find((m) => m.id === match.bottomPrecedingMatchId));
            }
        }
        currentRoundMatches = nextRoundMatches;
        currentRound++;
    }
    // Render the bracket
    const roundElements = [];
    roundsMap.forEach((roundMatches, round) => {
        const roundElement = document.createElement("div");
        roundElement.className = "round";
        if (round === roundsMap.size - 1) {
            // Last round (first matches)
            let lastLocalIndex = 0;
            roundMatches.forEach((match) => {
                // Add filler invisible matches
                for (let i = lastLocalIndex + 1; i < match.localIndex; i++) {
                    const invisibleMatch = document.createElement("div");
                    invisibleMatch.className = "invisible-match";
                    roundElement.appendChild(invisibleMatch);
                }
                const matchElement = createMatchElement(match);
                roundElement.appendChild(matchElement);
                lastLocalIndex = match.localIndex;
            });
            // Add remaining invisible matches if needed
            const maxLocalIndex = Math.pow(2, roundsMap.size - 1);
            for (let i = lastLocalIndex + 1; i <= maxLocalIndex; i++) {
                const invisibleMatch = document.createElement("div");
                invisibleMatch.className = "invisible-match";
                roundElement.appendChild(invisibleMatch);
            }
        } else {
            roundMatches.forEach((match) => {
                const matchElement = createMatchElement(match);
                roundElement.appendChild(matchElement);
            });
        }
        roundElements.push(roundElement);
    });
    // Add rounds to the bracket, starting from the first round (reversed order)
    roundElements.reverse().forEach((roundElement, index) => {
        bracketElement.appendChild(roundElement);
    });
    // Draw connecting lines between matches
    // Use setTimeout to ensure all elements are rendered before drawing lines
    setTimeout(() => drawLines(CONFIG.matches), 0);
}

function handleResize() {
    const participantCount = parseInt(document.getElementById("participantCount").value);
    if (!isNaN(participantCount) && participantCount >= CONFIG.minParticipants && participantCount <= CONFIG.maxParticipants) {
        drawLines(CONFIG.matches);
    }
}

function toggleState() {
    CONFIG.state = CONFIG.state === "Configuration" ? "Running" : "Configuration";
    document.getElementById("stateLabel").textContent = CONFIG.state;
    updateUIBasedOnState();
}

function updateUIBasedOnState() {
    const participantCountInput = document.getElementById("participantCount");
    const generateButton = document.getElementById("generateButton");
    const participants = document.querySelectorAll(".participant");
    if (CONFIG.state === "Configuration") {
        participantCountInput.disabled = false;
        generateButton.disabled = false;
        participants.forEach((p) => p.classList.add("editable"));
    } else {
        participantCountInput.disabled = true;
        generateButton.disabled = true;
        participants.forEach((p) => p.classList.remove("editable"));
    }
}
document.getElementById("generateButton").addEventListener("click", generateBracket);
document.getElementById("stateSwitch").addEventListener("change", toggleState);
document.getElementById("saveButton").addEventListener("click", saveData);
document.getElementById("resetMatchProgressButton").addEventListener("click", resetMatchProgress);
document.getElementById("resetButton").addEventListener("click", resetAllData);
window.addEventListener("resize", handleResize);
// Initial UI update
updateUIBasedOnState();
