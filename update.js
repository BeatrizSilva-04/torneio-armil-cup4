const fs = require('fs');

const filePath = 'index.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. CSS
const cssAddition = `
        /* Match Timeline CSS */
        .match-timeline {
            margin-top: 1rem;
            padding-top: 0.75rem;
            border-top: 1px dashed rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .timeline-event {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: #4b5563;
            animation: fadeUp 0.3s ease-out both;
        }
        .timeline-event.team1-event {
            justify-content: flex-start;
        }
        .timeline-event.team2-event {
            flex-direction: row-reverse;
            padding-right: 0.25rem;
        }
        .event-minute {
            font-weight: 700;
            color: #111827;
            background: rgba(0,0,0,0.05);
            padding: 0.15rem 0.4rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
        }
        .event-icon {
            font-size: 0.9rem;
        }
        .event-player {
            font-weight: 600;
            color: #374151;
        }

        /* Bracket CSS */
        .bracket-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2.5rem;
            padding: 1.5rem 0;
        }
        .grand-final-wrapper {
            transform: scale(1.05);
            margin-bottom: 1rem;
            position: relative;
            width: 100%;
            max-width: 500px;
        }
        .placement-matches-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            width: 100%;
        }
        .grand-final-card {
            border: 2px solid #fbbf24 !important;
            background: linear-gradient(135deg, rgba(255, 252, 232, 0.95) 0%, rgba(255, 255, 255, 0.95) 100%) !important;
            box-shadow: 0 10px 40px -10px rgba(251, 191, 36, 0.4) !important;
        }
        .grand-final-badge {
            position: absolute;
            top: -14px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(to right, #f59e0b, #fbbf24);
            color: #78350f;
            padding: 0.25rem 1.25rem;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            white-space: nowrap;
            z-index: 10;
        }
        
        .tree-line-wrapper {
            position: relative;
            width: 100%;
            display: flex;
            justify-content: center;
        }
        .tree-line {
            width: 2px;
            height: 40px;
            background: linear-gradient(to bottom, #d1d5db, #fbbf24);
        }
`;
content = content.replace('</style>', cssAddition + '\n    </style>');

// 2. Edit Modal HTML
const editModalHTML = `
                    <div class="mt-4 border-t pt-4">
                        <h4 class="text-sm font-semibold mb-2 flex items-center gap-2">
                            <span>⏱️ Timeline de Eventos</span>
                        </h4>
                        <div class="grid grid-cols-12 gap-2 mb-2">
                            <input type="number" id="event-minute" class="input input-sm col-span-2" placeholder="Min" min="1">
                            <select id="event-team" class="select input-sm col-span-3">
                                <option value="1">Eq. 1</option>
                                <option value="2">Eq. 2</option>
                            </select>
                            <input type="text" id="event-player" class="input input-sm col-span-4" placeholder="Nome">
                            <select id="event-type" class="select input-sm col-span-3">
                                <option value="goal">⚽</option>
                                <option value="yellow">🟨</option>
                                <option value="red">🟥</option>
                            </select>
                        </div>
                        <button type="button" id="add-event-btn" class="btn btn-outline w-full btn-sm mb-3">+ Adicionar à Timeline</button>
                        <div id="edit-events-list" class="space-y-1 max-h-32 overflow-y-auto text-sm p-2 bg-gray-50 rounded border"></div>
                    </div>

                    <div class="flex gap-2">`;
content = content.replace('<div class="flex gap-2">', editModalHTML);

// 3. New JS State & Helpers
const stateAddition = `
        let editingScorersCategory = null;
        let currentEditScorers = [];
        let currentEditEvents = []; // NEW

`;
content = content.replace('let editingScorersCategory = null;\n        let currentEditScorers = [];', stateAddition);

const timelineHelper = `
        function generateTimelineHtml(match) {
            if (!match.events || match.events.length === 0) return '';
            const sortedEvents = [...match.events].sort((a,b) => parseInt(a.minute) - parseInt(b.minute));
            
            let html = '<div class="match-timeline">';
            sortedEvents.forEach(ev => {
                const isTeam1 = ev.team === match.team1;
                const iconClasses = ev.type === 'goal' ? '⚽' : (ev.type === 'yellow' ? '🟨' : '🟥');
                html += \`
                    <div class="timeline-event \${isTeam1 ? 'team1-event' : 'team2-event'}">
                        <span class="event-minute">\${ev.minute}'</span>
                        <span class="event-icon">\${iconClasses}</span>
                        <span class="event-player">\${ev.player || 'Jogador'}</span>
                    </div>
                \`;
            });
            html += '</div>';
            return html;
        }

        function generateMatchHtmlForCard(match, isAdminMode, isGrandFinal) {
            return \`
                <div class="match-card \${isGrandFinal ? 'grand-final-card' : ''}">
                    <div class="match-header">
                        <div class="match-teams \${isGrandFinal ? 'text-lg' : ''}">\${match.team1} vs \${match.team2}</div>
                        \${match.status !== "upcoming" ? \`<div class="match-score \${isGrandFinal ? 'text-2xl' : ''}">\${match.score1} - \${match.score2}</div>\` : ''}
                    </div>
                    <div class="match-info">
                        <div class="match-time-field">
                            <span class="match-time">\${match.time}</span>
                            <div class="match-field">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>\${match.field}</span>
                            </div>
                        </div>
                        <div class="match-actions">
                            \${getStatusBadge(match.status)}
                            \${isAdminMode ? \`
                                <button class="btn btn-outline btn-sm edit-match-btn" data-match-id="\${match.id}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                            \` : ''}
                        </div>
                    </div>
                    \${generateTimelineHtml(match)}
                </div>
            \`;
        }

        function getStatusBadge(status) {`;
content = content.replace('function getStatusBadge(status) {', timelineHelper);

// 4. Update Regular Matches to show timeline
content = content.replace(/<\/div>\s*<\/div>\s*`;\s*\}\);\s*html \+= `/g, '\${generateTimelineHtml(match)}\n                            </div>\n                        `;\n                    });\n\n                    html += `');


// Replace finals block with bracket logic
const oldFinalsStart = 'data.finals.forEach((final) => {';
const oldFinalsEnd = `    document.getElementById(category).innerHTML = html;
            });`;

const replaceIndex = content.indexOf('data.finals.forEach((final) => {');
const endIndex = content.indexOf('document.getElementById(category).innerHTML = html;', replaceIndex);
if (replaceIndex !== -1 && endIndex !== -1) {
    const newFinalsHTML = `
                let grandFinal = null;
                let placementMatches = [];
                let otherEvents = [];

                data.finals.forEach((final) => {
                    if (final.id) {
                        if (final.team1.includes("1º L.") || final.team1.includes("1º") || final.team1.includes("Armil") && final.status) { // fallback
                            grandFinal = final;
                        } else {
                            placementMatches.push(final);
                        }
                    } else {
                        otherEvents.push(final);
                    }
                });

                if (grandFinal) {
                    html += \`
                        <div class="grand-final-wrapper">
                            <div class="grand-final-badge">🏆 GRANDE FINAL</div>
                            \${generateMatchHtmlForCard(grandFinal, isAdminMode, true)}
                        </div>
                    \`;
                }
                
                if (grandFinal && placementMatches.length > 0) {
                    html += \`<div class="tree-line-wrapper"><div class="tree-line"></div></div>\`;
                }

                if (placementMatches.length > 0) {
                    html += \`<div class="placement-matches-grid">\`;
                    placementMatches.forEach(match => {
                        html += generateMatchHtmlForCard(match, isAdminMode, false);
                    });
                    html += \`</div>\`;
                }

                if (otherEvents.length > 0) {
                    html += \`<div class="w-full mt-6 space-y-3">\`;
                    otherEvents.forEach(ev => {
                        html += \`
                            <div class="match-card bg-gradient-to-r from-amber-50 to-yellow-50 border-yellow-300 shadow-sm flex items-center justify-center p-4">
                                <div class="match-teams text-center text-lg font-bold text-yellow-800">
                                    🏆 \${ev.match} \${ev.time ? '(' + ev.time + ')' : ''}
                                </div>
                            </div>
                        \`;
                    });
                    html += \`</div>\`;
                }

            // Close container blocks
            html += \`
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            \`;

`;
    content = content.substring(0, replaceIndex) + newFinalsHTML + content.substring(endIndex);
}

// Ensure Timeline events show up in regular match view and live view
const liveTimelineReplaceIndex = content.indexOf('<div class="match-actions">', content.indexOf('liveMatchesList.innerHTML = liveMatchesHtml;'));
if (content.indexOf('${generateTimelineHtml(match)}', liveTimelineReplaceIndex - 50) === -1) {
    // Inject into live matches string
    content = content.replace(/<\/div>\s*<\/div>\s*`;\s*}\);\s*liveMatchesList\.innerHTML/, '\${generateTimelineHtml(match)}\n                            </div>\n                        </div>\n                    `;\n                });\n                liveMatchesList.innerHTML');
}


// Event handlers for Edit match
const setupEventsList = `
        function renderEditEventsList() {
            const list = document.getElementById('edit-events-list');
            if (!currentEditEvents || currentEditEvents.length === 0) {
                list.innerHTML = '<div class="text-gray-500 text-center py-2">Sem eventos</div>';
                return;
            }
            let html = '';
            currentEditEvents.forEach((ev, idx) => {
                const iconClasses = ev.type === 'goal' ? '⚽' : (ev.type === 'yellow' ? '🟨' : '🟥');
                html += \`
                    <div class="flex items-center justify-between p-1 bg-white border rounded">
                        <span>\${ev.minute}' - \${iconClasses} \${ev.player} (\${ev.team})</span>
                        <button type="button" class="text-red-500 font-bold px-2 py-0.5 rounded hover:bg-red-50 remove-event-btn" data-index="\${idx}">X</button>
                    </div>
                \`;
            });
            list.innerHTML = html;

            document.querySelectorAll('.remove-event-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    currentEditEvents.splice(parseInt(this.getAttribute('data-index')), 1);
                    renderEditEventsList();
                });
            });
        }

        document.getElementById('add-event-btn').addEventListener('click', function() {
            const min = document.getElementById('event-minute').value;
            const tId = document.getElementById('event-team').value;
            const player = document.getElementById('event-player').value || 'Jogador';
            const type = document.getElementById('event-type').value;

            if (min && editingMatch) {
                const teamName = tId === "1" ? editingMatch.team1 : editingMatch.team2;
                currentEditEvents.push({ minute: min, team: teamName, player, type });
                document.getElementById('event-minute').value = '';
                document.getElementById('event-player').value = '';
                renderEditEventsList();
            }
        });

        // Setup the modal context on click edit match`;
content = content.replace('document.querySelectorAll(\'.edit-match-btn\').forEach(btn => {', setupEventsList + '\n        document.querySelectorAll(\'.edit-match-btn\').forEach(btn => {');

const modalContextSetting = `
                        document.getElementById('edit-status').value = match.status;

                        // Setup event editing
                        currentEditEvents = match.events ? [...match.events] : [];
                        document.getElementById('event-team').innerHTML = \`<option value="1">\${match.team1}</option><option value="2">\${match.team2}</option>\`;
                        renderEditEventsList();

                        document.getElementById('edit-modal').classList.add('active');`;
content = content.replace("document.getElementById('edit-status').value = match.status;\n                        document.getElementById('edit-modal').classList.add('active');", modalContextSetting);

const saveMatchSetting = `
                    score1: parseInt(document.getElementById('edit-score1').value) || 0,
                    score2: parseInt(document.getElementById('edit-score2').value) || 0,
                    status: document.getElementById('edit-status').value,
                    events: currentEditEvents
                };`;
content = content.replace(`score1: parseInt(document.getElementById('edit-score1').value) || 0,
                    score2: parseInt(document.getElementById('edit-score2').value) || 0,
                    status: document.getElementById('edit-status').value
                };`, saveMatchSetting);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete.');
