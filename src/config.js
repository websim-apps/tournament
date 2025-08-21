export const CONFIG = {
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

export const STATE = {
  participantNames: new Map(), // Map to store participant names
};

export class Match {
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
