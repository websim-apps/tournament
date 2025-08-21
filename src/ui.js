import { CONFIG, STATE } from './config.js';
import { getParticipantName } from './state.js';

// --- RENDER FUNCTIONS ---

export function renderSavedBracket() {
    const bracketElement = document.getElementById("bracket");
    bracketElement.innerHTML = "";
    if (CONFIG.matches.length === 0) return;

    const roundsMap = new Map();
    CONFIG.matches.forEach((match) => {
        const round = Math.floor(Math.log2(match.id));
        if (!roundsMap.has(round)) {
            roundsMap.set(round, []);
        }
        roundsMap.get(round).push(match);
    });

    const roundElements = [];
    roundsMap.forEach((roundMatches, round) => {
        const roundElement = document.createElement("div");
        roundElement.className = "round";
        roundMatches.sort((a, b) => a.localIndex - b.localIndex);

        if (round === roundsMap.size - 1) {
            let lastLocalIndex = 0;
            roundMatches.forEach((match) => {
                for (let i = lastLocalIndex + 1; i < match.localIndex; i++) {
                    const invisibleMatch = document.createElement("div");
                    invisibleMatch.className = "invisible-match";
                    roundElement.appendChild(invisibleMatch);
                }
                roundElement.appendChild(createMatchElement(match));
                lastLocalIndex = match.localIndex;
            });
            const maxLocalIndex = Math.pow(2, roundsMap.size - 1);
            for (let i = lastLocalIndex + 1; i <= maxLocalIndex; i++) {
                const invisibleMatch = document.createElement("div");
                invisibleMatch.className = "invisible-match";
                roundElement.appendChild(invisibleMatch);
            }
        } else {
            roundMatches.forEach((match) => {
                roundElement.appendChild(createMatchElement(match));
            });
        }
        roundElements.push(roundElement);
    });

    roundElements.reverse().forEach((roundElement) => {
        bracketElement.appendChild(roundElement);
    });

    updateMatchScores();
    setTimeout(() => drawLines(CONFIG.matches), 0);
}

function updateMatchScores() {
    CONFIG.matches.forEach((match) => {
        const matchElement = document.getElementById(`match-${match.id}`);
        if (!matchElement) return;

        const topParticipantElement = matchElement.children[1];
        const bottomParticipantElement = matchElement.children[2];
        updateParticipantScore(topParticipantElement, match.topScore);
        updateParticipantScore(bottomParticipantElement, match.bottomScore);
    });
}

function updateParticipantScore(participantElement, score) {
    let scoreElement = participantElement.querySelector(".score");
    if (score !== null) {
        if (!scoreElement) {
            scoreElement = document.createElement("span");
            scoreElement.className = "score";
            participantElement.appendChild(scoreElement);
        }
        scoreElement.textContent = score;
    } else if (scoreElement) {
        scoreElement.remove();
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

    matchElement.appendChild(createParticipantElement(match.topParticipantID, match.topScore));
    matchElement.appendChild(createParticipantElement(match.bottomParticipantID, match.bottomScore));
    
    return matchElement;
}

function createParticipantElement(participantId, score) {
    const participantElement = document.createElement("div");
    participantElement.className = "participant";

    if (participantId) {
        participantElement.textContent = getParticipantName(participantId);
        participantElement.dataset.participantId = participantId;
        if (CONFIG.state === "Configuration") {
            participantElement.classList.add("editable");
        }
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

// --- EVENT HANDLERS & UI LOGIC ---

function handleParticipantClick(event) {
    const participantElement = event.currentTarget;
    if (CONFIG.state === "Configuration" && participantElement.dataset.participantId) {
        editParticipantName(participantElement);
    } else if (CONFIG.state === "Running") {
        advanceParticipant(participantElement);
    }
}

function editParticipantName(participantElement) {
    const participantId = participantElement.dataset.participantId;
    const currentName = getParticipantName(parseInt(participantId));
    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.value = currentName.startsWith("Participant #") ? "" : currentName;
    inputElement.placeholder = currentName;
    inputElement.className = "participant-input";
    
    const onBlur = () => handleParticipantNameChange(inputElement, participantId);
    inputElement.addEventListener("blur", onBlur);
    inputElement.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            inputElement.removeEventListener("blur", onBlur); // Prevent double firing
            handleParticipantNameChange(inputElement, participantId);
        }
    });

    participantElement.textContent = "";
    participantElement.appendChild(inputElement);
    inputElement.focus();
    inputElement.select();
}

function handleParticipantNameChange(inputElement, participantId) {
    const newName = inputElement.value.trim();
    const pId = parseInt(participantId);
    if (newName) {
        STATE.participantNames.set(pId, newName);
    } else {
        STATE.participantNames.delete(pId);
    }
    
    // Re-render the whole bracket to update all instances of the name
    renderSavedBracket();
}

function advanceParticipant(participantElement) {
    const matchElement = participantElement.closest(".match");
    if (!matchElement) return;

    const matchId = parseInt(matchElement.id.split("-")[1]);
    const match = CONFIG.matches.find((m) => m.id === matchId);
    if (!match || !participantElement.dataset.participantId) return;

    const isTopParticipant = participantElement === matchElement.children[1];
    const winningParticipantId = parseInt(participantElement.dataset.participantId);
    const losingParticipantId = isTopParticipant ? match.bottomParticipantID : match.topParticipantID;
    
    if (!losingParticipantId) {
        console.log("Cannot advance participant. Opponent is TBD.");
        return;
    }
    
    const nextMatch = CONFIG.matches.find((m) => m.topPrecedingMatchId === matchId || m.bottomPrecedingMatchId === matchId);
    if (nextMatch) {
        const isTopSlot = nextMatch.topPrecedingMatchId === matchId;
        if (isTopSlot) {
            nextMatch.topParticipantID = winningParticipantId;
        } else {
            nextMatch.bottomParticipantID = winningParticipantId;
        }
    }
    
    match.topScore = isTopParticipant ? 1 : 0;
    match.bottomScore = isTopParticipant ? 0 : 1;
    
    renderSavedBracket(); // Re-render to show advancement and scores
}

export function drawLines(matches) {
    const existingSvg = document.querySelector("svg");
    if (existingSvg) existingSvg.remove();

    const bracketElement = document.getElementById("bracket");
    if (!bracketElement || matches.length === 0) return;

    const svg = document.createElementNS(CONFIG.svgNamespace, "svg");
    svg.style.position = "absolute";
    svg.style.top = `${bracketElement.offsetTop}px`;
    svg.style.left = `${bracketElement.offsetLeft}px`;
    svg.style.width = `${bracketElement.scrollWidth}px`;
    svg.style.height = `${bracketElement.scrollHeight}px`;
    svg.style.pointerEvents = "none";
    
    // Insert SVG before the bracket element to maintain z-index
    bracketElement.parentElement.insertBefore(svg, bracketElement);

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
    if (!fromElement || !toElement) return;

    const bracketElement = document.getElementById("bracket");
    const bracketRect = bracketElement.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const fromX = fromRect.right - svgRect.left;
    const fromY = fromRect.top + fromRect.height / 2 - svgRect.top;
    
    const toX = toRect.left - svgRect.left;
    const toY = toRect.top + (isTop ? toRect.height * 0.25 : toRect.height * 0.75) - svgRect.top;

    const midX = fromX + CONFIG.horizontalSpacing / 2;

    const line = document.createElementNS(CONFIG.svgNamespace, "path");
    line.setAttribute("d", `M ${fromX},${fromY} H ${midX} V ${toY} H ${toX}`);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", CONFIG.lineColor);
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
}

export function handleResize() {
    if (CONFIG.matches.length > 0) {
        drawLines(CONFIG.matches);
    }
}

export function toggleState() {
    CONFIG.state = CONFIG.state === "Configuration" ? "Running" : "Configuration";
    document.getElementById("stateLabel").textContent = CONFIG.state;
    updateUIBasedOnState();
    renderSavedBracket();
}

export function updateUIBasedOnState() {
    const participantCountInput = document.getElementById("participantCount");
    const generateButton = document.getElementById("generateButton");

    const isConfig = CONFIG.state === "Configuration";
    participantCountInput.disabled = !isConfig;
    generateButton.disabled = !isConfig;
}
