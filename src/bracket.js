import { CONFIG, STATE, Match } from './config.js';
import { renderSavedBracket } from './ui.js';

export function generateBracket() {
    if (CONFIG.state !== "Configuration") {
        console.log("Cannot generate bracket in Running state");
        return;
    }

    const participantCountInput = document.getElementById("participantCount");
    const participantCount = parseInt(participantCountInput.value);
    const errorElement = document.getElementById("error");
    
    if (isNaN(participantCount) || participantCount < CONFIG.minParticipants || participantCount > CONFIG.maxParticipants) {
        errorElement.textContent = `Please enter a number between ${CONFIG.minParticipants} and ${CONFIG.maxParticipants}.`;
        return;
    }
    
    errorElement.textContent = "";
    
    // Clear any excess participant names
    const currentNames = new Map(STATE.participantNames);
    STATE.participantNames.clear();
    for (let i = 1; i <= participantCount; i++) {
        if (currentNames.has(i)) {
            STATE.participantNames.set(i, currentNames.get(i));
        }
    }
    
    CONFIG.matches = [];
    if (participantCount < 2) {
        renderSavedBracket();
        return;
    }

    let matchId = 1;
    CONFIG.matches.push(new Match(matchId, 1, 2, null, null, null, null, 1));
    console.log(`Generated match: ID ${matchId}, Participants: 1, 2, LocalIndex: 1`);

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
        }
    }

    renderSavedBracket();
}
