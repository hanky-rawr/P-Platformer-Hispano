document.addEventListener('DOMContentLoaded', () => {
    let allLevels = [];
    let currentLevel = null;
    let countryStats = {};
    let playerLeaderboard = [];
    let comunidadData = null;
    let staffData = null;
    let activeView = 'lista';
    let currentLeaderboardSubView = 'players'; 

    const levelsListContainer = document.getElementById('levels-list');
    const detailPanel = document.getElementById('level-detail-panel');
    const searchInput = document.getElementById('search-input');
    const countryFilter = document.getElementById('country-filter');
    const navLista = document.getElementById('nav-lista');
    const navLeaderboard = document.getElementById('nav-leaderboard');
    const navInfo = document.getElementById('nav-info');
    const mainContent = document.getElementById('main-content');
    
    const countryModal = document.getElementById('country-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBody = document.getElementById('modal-body');

    const getFlag = (country) => {
        const flags = { "Argentina": "🇦🇷", "Chile": "🇨🇱", "México": "🇲🇽", "Mexico": "🇲🇽", "España": "🇪🇸", "Colombia": "🇨🇴", "Perú": "🇵🇪", "Peru": "🇵🇪", "Venezuela": "🇻🇪", "Uruguay": "🇺🇾", "Ecuador": "🇪🇨" };
        return flags[country] || "🌎";
    };

    const isMobile = () => window.innerWidth <= 768;

    async function init() {
        try {
            const listResponse = await fetch('data/levels/_list.json');
            const levelFiles = await listResponse.json();
            const levelPromises = levelFiles.map(file => fetch(`data/levels/${file}.json`).then(res => res.json()));
            allLevels = await Promise.all(levelPromises);

            const comunidadResponse = await fetch('data/comunidad.json');
            comunidadData = await comunidadResponse.json();
            
            const staffResponse = await fetch('data/staff.json');
            staffData = await staffResponse.json();

            processDynamicData();
            populateCountryFilter();
            renderSidebar(allLevels);
            if (allLevels.length > 0) displayLevelDetails(allLevels[0]);

            setupEvents();
        } catch (error) {
            console.error("Error:", error);
        }
    }

    function processDynamicData() {
        countryStats = {};
        const playerMap = {};

        allLevels.forEach((level, index) => {
            const rankPosition = index + 1;
            const levelPoints = Math.max(10, 250 - (index * 15)); 

            level.records.forEach(rec => {
                const country = rec.country ? rec.country.trim() : "Desconocido";
                const user = rec.user.trim();
                const isCompletion = true;

                // --- ESTADÍSTICAS POR PAÍS ---
                if (!countryStats[country]) {
                    countryStats[country] = {
                        name: country,
                        players: new Set(),
                        recordsCount: 0,
                        uniqueDemons: new Set(),
                        hardestName: "Ninguno",
                        hardestRank: Infinity,
                        demonsBreakdown: {} 
                    };
                }

                countryStats[country].recordsCount++;
                countryStats[country].players.add(user);
                
                if (isCompletion) {
                    countryStats[country].uniqueDemons.add(level.id);
                    
                    if (!countryStats[country].demonsBreakdown[level.name]) {
                        countryStats[country].demonsBreakdown[level.name] = 0;
                    }
                    countryStats[country].demonsBreakdown[level.name]++;

                    if (rankPosition < countryStats[country].hardestRank) {
                        countryStats[country].hardestRank = rankPosition;
                        countryStats[country].hardestName = level.name;
                    }
                }

                if (!playerMap[user]) {
                    playerMap[user] = {
                        name: user, country: country, device: rec.device,
                        completedCount: 0, totalPoints: 0, hardestName: "Ninguno", hardestRank: Infinity,
                        completedDemons: [] 
                    };
                }
                
                if (isCompletion) {
                    playerMap[user].completedCount++;
                    playerMap[user].totalPoints += levelPoints;
                    playerMap[user].completedDemons.push({ name: level.name, time: rec.time || null });
                    if (rankPosition < playerMap[user].hardestRank) {
                        playerMap[user].hardestRank = rankPosition;
                        playerMap[user].hardestName = level.name;
                    }
                }
            });
        });

        playerLeaderboard = Object.values(playerMap).sort((a, b) => b.totalPoints - a.totalPoints);
    }

    function populateCountryFilter() {
        const sortedCountries = Object.keys(countryStats).sort();
        countryFilter.innerHTML = '<option value="">Todos los países</option>';
        sortedCountries.forEach(country => {
            if(country !== "Desconocido") {
                const opt = document.createElement('option');
                opt.value = country; opt.textContent = country;
                countryFilter.appendChild(opt);
            }
        });
    }

    function renderSidebar(levels) {
        const currentListContainer = document.getElementById('levels-list');
        if (!currentListContainer) return;

        const listTitleEl = document.querySelector('.list-title');
        const existingTagFilter = document.getElementById('tag-filter');
        const currentTagValue = existingTagFilter ? existingTagFilter.value : '';
        if (listTitleEl && !existingTagFilter) {
            const allTags = [...new Set(allLevels.map(l => l.tag).filter(Boolean))];
            if (allTags.length > 0) {
                const select = document.createElement('select');
                select.id = 'tag-filter';
                select.className = 'country-dropdown tag-dropdown';
                select.innerHTML = `<option value="">Todas las etiquetas</option>` +
                    allTags.map(t => `<option value="${t}">${t}</option>`).join('');
                select.onchange = performSearchAndFilter;
                listTitleEl.appendChild(select);
                select.value = currentTagValue;
            }
        }

        currentListContainer.innerHTML = '';

        if (levels.length === 0) {
            currentListContainer.innerHTML = '<p class="no-results">No se encontraron niveles.</p>';
            return;
        }

        levels.forEach((level) => {
            const realRank = allLevels.findIndex(l => l.id === level.id) + 1;
            const div = document.createElement('div');
            div.className = 'level-item';
            if (currentLevel && level.id === currentLevel.id) div.classList.add('selected');

            div.innerHTML = `
                <div class="level-rank">#${realRank}</div>
                <div class="level-info-meta">
                    <div class="level-name">${level.name}</div>
                    <div class="level-author">Por ${level.author}</div>
                </div>
                ${level.tag ? `<span class="level-tag-badge">${level.tag}</span>` : ''}
            `;
            div.onclick = () => {
                document.querySelectorAll('.level-item').forEach(i => i.classList.remove('selected'));
                div.classList.add('selected');
                if (isMobile()) {
                    // En móvil: ocultar lista y mostrar detalle a pantalla completa
                    const sidebar = document.querySelector('.sidebar-list');
                    const detail = document.getElementById('level-detail-panel');
                    if (sidebar) sidebar.style.display = 'none';
                    if (detail) {
                        detail.classList.add('mobile-detail-active');
                        // Agregar botón volver si no existe
                        if (!document.getElementById('mobile-back-btn')) {
                            const backBtn = document.createElement('button');
                            backBtn.id = 'mobile-back-btn';
                            backBtn.className = 'mobile-back-btn';
                            backBtn.innerHTML = '✕ Volver a la lista';
                            backBtn.onclick = () => {
                                if (sidebar) sidebar.style.display = '';
                                detail.classList.remove('mobile-detail-active');
                                backBtn.remove();
                            };
                            detail.prepend(backBtn);
                        }
                    }
                }
                displayLevelDetails(level);
            };
            currentListContainer.appendChild(div);
        });
    }

    function displayLevelDetails(level) {
        const currentDetailPanel = document.getElementById('level-detail-panel');
        if (!currentDetailPanel) return;

        currentLevel = level;

        let recordsRows = level.records.map(rec => `
            <tr>
                <td><strong>${rec.user}</strong></td>
                <td><span class="device-tag">${rec.device}</span></td>
                <td><span class="country-tag clickable-country" data-country="${rec.country}">${rec.country}</span></td>
                <td>${rec.hz}Hz</td>
                <td>${rec.time ? `<span class="time-badge">⏱ ${rec.time}</span>` : '—'}</td>
                <td><a href="${rec.link}" target="_blank" class="record-link">Ver Video</a></td>
            </tr>
        `).join('');

        currentDetailPanel.innerHTML = `
            <div class="level-detail-header">
                <div class="detail-title-row">
                    <div class="detail-title-left">
                        <h1>${level.name}</h1>
                        ${level.tag ? `<span class="detail-tag-badge">${level.tag}</span>` : ''}
                    </div>
                    <div class="detail-id-badge">ID: ${level.id}</div>
                </div>
                <div class="detail-credits">
                    <div class="credit-box"><strong>Autor</strong> ${level.author}</div>
                    <div class="credit-box"><strong>Creadores</strong> ${level.creators.join(', ')}</div>
                    <div class="credit-box"><strong>Verificador</strong> ${level.verifier}</div>
                </div>
            </div>

            <div class="video-wrapper">
                <iframe src="${level.verification.replace("watch?v=", "embed/")}" allowfullscreen></iframe>
            </div>

            <div class="meta-grid">
                <div class="meta-card">
                    <h3>Contraseña</h3>
                    <p>${level.password}</p>
                </div>
            </div>

            <div class="records-section">
                <h2>Récords Registrados (${level.records.length})</h2>
                <table class="records-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Plataforma</th>
                            <th>País</th>
                            <th>Hz</th>
                            <th>Tiempo</th>
                            <th>Evidencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recordsRows || '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No hay récords validados en este nivel.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
        attachModalClickEvents();
    }

    function renderLeaderboardView() {
        if (activeView !== 'leaderboard') return;
        
        const selectedCountry = document.getElementById('country-filter').value;
        let displayTitle = selectedCountry ? `Ranking de ${selectedCountry}` : 'Rankings & Estadísticas';
        if (selectedCountry) currentLeaderboardSubView = 'players';

        const mobile = isMobile();

        let contentHtml = `
            <div class="leaderboard-view">
                <div class="leaderboard-header">
                    <h1>${displayTitle}</h1>
                    <div class="view-switcher" style="${selectedCountry ? 'display:none;' : ''}">
                        <button id="sub-btn-players" class="switch-btn ${currentLeaderboardSubView === 'players' ? 'active' : ''}">Jugadores</button>
                        <button id="sub-btn-countries" class="switch-btn ${currentLeaderboardSubView === 'countries' ? 'active' : ''}">Países</button>
                        <button id="sub-btn-hardest" class="switch-btn ${currentLeaderboardSubView === 'hardest' ? 'active' : ''}">Hardest</button>
                    </div>
                </div>
        `;

        const sortedCountries = Object.values(countryStats).sort((a, b) => b.uniqueDemons.size - a.uniqueDemons.size || b.recordsCount - a.recordsCount);

        if (currentLeaderboardSubView === 'players') {
            let playersToShow = playerLeaderboard;
            if (selectedCountry) playersToShow = playerLeaderboard.filter(p => p.country === selectedCountry);

            if (mobile) {
                contentHtml += `<div class="lb-cards">` +
                    (playersToShow.length > 0 ? playersToShow.map((p, idx) => `
                        <div class="lb-card">
                            <div class="lb-card-rank">#${idx + 1}</div>
                            <div class="lb-card-body">
                                <div class="lb-card-name clickable-player" data-player="${p.name}">${p.name}</div>
                                <div class="lb-card-meta">
                                    <span class="country-tag clickable-country" data-country="${p.country}">${getFlag(p.country)} ${p.country}</span>
                                    <span class="lb-card-pts">${p.totalPoints} pts</span>
                                </div>
                                <div class="lb-card-sub">
                                    ${p.completedCount} demon${p.completedCount !== 1 ? 's' : ''} · Hardest: <em>${p.hardestName}</em>
                                </div>
                            </div>
                        </div>
                    `).join('') : `<p class="no-results">No hay jugadores de este país.</p>`) +
                `</div>`;
            } else {
                contentHtml += `
                    <table class="records-table unified-table">
                        <thead><tr><th>Puesto</th><th>Jugador</th><th>País</th><th>Demons</th><th>Hardest</th><th>Puntos</th></tr></thead>
                        <tbody>
                            ${playersToShow.length > 0 ? playersToShow.map((p, idx) => `
                                <tr>
                                    <td><strong>#${idx + 1}</strong></td>
                                    <td><strong class="clickable-player" data-player="${p.name}">${p.name}</strong></td>
                                    <td><span class="country-tag clickable-country" data-country="${p.country}">${p.country}</span></td>
                                    <td>${p.completedCount}</td>
                                    <td style="font-size:0.9rem;color:#a4c2e6;">${p.hardestName}</td>
                                    <td style="color:var(--primary-glow);font-weight:bold;">${p.totalPoints}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="6" style="text-align:center;padding:2rem;">No hay jugadores registrados de este país.</td></tr>`}
                        </tbody>
                    </table>`;
            }

        } else if (currentLeaderboardSubView === 'countries') {
            if (mobile) {
                contentHtml += `<div class="lb-cards">` +
                    sortedCountries.map((c, idx) => `
                        <div class="lb-card">
                            <div class="lb-card-rank">#${idx + 1}</div>
                            <div class="lb-card-body">
                                <div class="lb-card-name clickable-text" data-country="${c.name}">${getFlag(c.name)} ${c.name}</div>
                                <div class="lb-card-meta">
                                    <span>${c.players.size} jugadores</span>
                                    <span class="demon-count-badge">${c.uniqueDemons.size} demons</span>
                                </div>
                                <div class="lb-card-sub">Hardest: <em>${c.hardestName}</em></div>
                            </div>
                        </div>
                    `).join('') +
                `</div>`;
            } else {
                contentHtml += `
                    <table class="records-table unified-table">
                        <thead><tr><th>Puesto</th><th>País</th><th>Jugadores</th><th>Récords Totales</th><th>Demons Distintos</th><th>Hardest del País</th></tr></thead>
                        <tbody>
                            ${sortedCountries.map((c, idx) => `
                                <tr>
                                    <td><strong>#${idx + 1}</strong></td>
                                    <td><strong class="clickable-text" data-country="${c.name}">${getFlag(c.name)} ${c.name}</strong></td>
                                    <td>${c.players.size}</td>
                                    <td>${c.recordsCount}</td>
                                    <td><span class="demon-count-badge">${c.uniqueDemons.size}</span></td>
                                    <td style="font-size:0.9rem;color:#a4c2e6;">${c.hardestName}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
            }

        } else if (currentLeaderboardSubView === 'hardest') {
            const hardestList = sortedCountries.filter(c => c.hardestRank !== Infinity).sort((a, b) => a.hardestRank - b.hardestRank);
            if (mobile) {
                contentHtml += `<div class="lb-cards">` +
                    hardestList.map((c, idx) => `
                        <div class="lb-card">
                            <div class="lb-card-rank">#${idx + 1}</div>
                            <div class="lb-card-body">
                                <div class="lb-card-name clickable-text" data-country="${c.name}">${getFlag(c.name)} ${c.name}</div>
                                <div class="lb-card-meta">
                                    <span style="color:var(--primary-glow);font-weight:bold;">${c.hardestName}</span>
                                </div>
                                <div class="lb-card-sub">Top #${c.hardestRank}</div>
                            </div>
                        </div>
                    `).join('') +
                `</div>`;
            } else {
                contentHtml += `
                    <table class="records-table unified-table">
                        <thead><tr><th>Top</th><th>País</th><th>Hardest Completado</th><th>Posición en Lista</th></tr></thead>
                        <tbody>
                            ${hardestList.map((c, idx) => `
                                <tr>
                                    <td><strong>#${idx + 1}</strong></td>
                                    <td><strong class="clickable-text" data-country="${c.name}">${getFlag(c.name)} ${c.name}</strong></td>
                                    <td style="color:var(--primary-glow);font-weight:bold;">${c.hardestName}</td>
                                    <td>Top #${c.hardestRank}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
            }
        }

        contentHtml += `</div>`;
        mainContent.innerHTML = contentHtml;

        if (!selectedCountry) {
            document.getElementById('sub-btn-players').onclick = () => { currentLeaderboardSubView = 'players'; renderLeaderboardView(); };
            document.getElementById('sub-btn-countries').onclick = () => { currentLeaderboardSubView = 'countries'; renderLeaderboardView(); };
            document.getElementById('sub-btn-hardest').onclick = () => { currentLeaderboardSubView = 'hardest'; renderLeaderboardView(); };
        }

        attachModalClickEvents();
    }

    function renderInfoView() {
        if (activeView !== 'info') return;

        let contentHtml = `
            <div class="info-view">
                <!-- SECCIÓN COMUNIDAD -->
                <section class="info-section community-section">
                    <h1>Comunidad</h1>
                    <p class="community-description">${comunidadData.description}</p>
                    
                    <div class="community-objectives">
                        <h2>Objetivos</h2>
                        <ul>
                            ${comunidadData.objectives.map(obj => `<li>${obj}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="community-links">
                        <h2>Enlaces</h2>
                        <div class="links-grid">
                            ${comunidadData.links.map(link => `
                                <a href="${link.url}" target="_blank" class="community-link-btn">
                                    ${link.label}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </section>

                <!-- SECCIÓN STAFF -->
                <section class="info-section staff-section">
                    <h1>Owners</h1>
                    
                    <div class="creator-info">
                        <div class="creator-card">
                            <h2>Creador Principal</h2>
                            <div class="creator-details">
                                <img src="${staffData.creator.avatar}" alt="${staffData.creator.name}" class="creator-avatar">
                                <div class="creator-text">
                                    <h3>${staffData.creator.name}</h3>
                                    <p>${staffData.creator.bio}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2>Miembros del Staff</h2>
                    <div class="staff-members-container">
                        ${staffData.staff_members.map(member => `
                            <div class="staff-card" style="border-left: 4px solid ${member.color}">
                                <strong style="color: ${member.color}">${member.name}</strong>
                                <span>${member.role}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>
        `;

        mainContent.innerHTML = contentHtml;
    }

    function openCountryModal(countryName) {
        if (!countryStats[countryName] || countryName === "Desconocido") return;
        const c = countryStats[countryName];

        const demonsList = Object.keys(c.demonsBreakdown)
            .sort((a, b) => c.demonsBreakdown[b] - c.demonsBreakdown[a]) 
            .map(levelName => {
                const count = c.demonsBreakdown[levelName];
                return `<li class="modal-demon-item"><strong>${levelName}</strong> <span class="record-count">(${count} record${count > 1 ? 's' : ''})</span></li>`;
            }).join('');

        modalBody.innerHTML = `
            <div class="modal-header-info">
                <div class="modal-flag">${getFlag(c.name)}</div>
                <h2>${c.name}</h2>
            </div>
            <div class="modal-stats-grid">
                <div class="m-stat"><span>Jugadores</span><strong>${c.players.size}</strong></div>
                <div class="m-stat"><span>Hardest</span><strong>${c.hardestName}</strong></div>
                <div class="m-stat"><span>Demons Distintos</span><strong>${c.uniqueDemons.size}</strong></div>
            </div>
            <div class="modal-demons-list">
                <h3>Demons Completados</h3>
                <ul>${demonsList}</ul>
            </div>
        `;
        countryModal.classList.add('show');
    }

    function openPlayerModal(playerName) {
        const p = playerLeaderboard.find(pl => pl.name === playerName);
        if (!p) return;

        const seen = new Set();
        const uniqueDemons = p.completedDemons.filter(d => {
            if (seen.has(d.name)) return false;
            seen.add(d.name);
            return true;
        });
        const demonsList = uniqueDemons.map(d => {
            return `<li class="modal-demon-item">
                <strong>${d.name}</strong>
                ${d.time ? `<span class="time-badge">⏱ ${d.time}</span>` : ''}
            </li>`;
        }).join('');

        modalBody.innerHTML = `
            <div class="modal-header-info">
                <div class="modal-flag">👤</div>
                <h2>${p.name}</h2>
                <span class="country-tag" style="margin-top: 10px; display: inline-block;">${getFlag(p.country)} ${p.country}</span>
            </div>
            <div class="modal-stats-grid">
                <div class="m-stat"><span>Puntos Totales</span><strong>${p.totalPoints}</strong></div>
                <div class="m-stat"><span>Hardest</span><strong>${p.hardestName}</strong></div>
                <div class="m-stat"><span>Demons Pasados</span><strong>${p.completedCount}</strong></div>
            </div>
            <div class="modal-demons-list">
                <h3>Registro de Demons</h3>
                <ul>${demonsList}</ul>
            </div>
        `;
        countryModal.classList.add('show');
    }

    function attachModalClickEvents() {
        // Eventos para abrir modal de país
        document.querySelectorAll('.clickable-country, .clickable-text').forEach(el => {
            el.addEventListener('click', (e) => {
                const country = e.currentTarget.getAttribute('data-country');
                openCountryModal(country);
            });
        });

        document.querySelectorAll('.clickable-player').forEach(el => {
            el.addEventListener('click', (e) => {
                const player = e.currentTarget.getAttribute('data-player');
                openPlayerModal(player);
            });
        });
    }

    function setupEvents() {
        searchInput.oninput = performSearchAndFilter;
        countryFilter.onchange = performSearchAndFilter;

        navLista.onclick = () => {
            if (activeView === 'lista') return;
            activeView = 'lista';
            navLeaderboard.classList.remove('active');
            navInfo.classList.remove('active');
            navLista.classList.add('active');
            mainContent.innerHTML = `<aside class="sidebar-list"><div class="list-title">Niveles Oficiales</div><div class="levels-container" id="levels-list"></div></aside><section class="detail-container" id="level-detail-panel"></section>`;
            window.levelsListContainer = document.getElementById('levels-list');
            window.detailPanel = document.getElementById('level-detail-panel');
            setTimeout(() => { levelsListContainer.id = "levels-list"; }, 0);
            performSearchAndFilter();
        };

        navLeaderboard.onclick = () => {
            activeView = 'leaderboard';
            navLista.classList.remove('active');
            navLeaderboard.classList.add('active');
            navInfo.classList.remove('active');
            renderLeaderboardView();
        };

        navInfo.onclick = () => {
            activeView = 'info';
            navLista.classList.remove('active');
            navLeaderboard.classList.remove('active');
            navInfo.classList.add('active');
            renderInfoView();
        };

        modalCloseBtn.onclick = () => countryModal.classList.remove('show');
        countryModal.onclick = (e) => { if (e.target === countryModal) countryModal.classList.remove('show'); };

        // Menú hamburguesa móvil
        const hamburger = document.getElementById('nav-hamburger');
        const navLinksMenu = document.getElementById('nav-links-menu');
        if (hamburger && navLinksMenu) {
            hamburger.onclick = () => {
                hamburger.classList.toggle('open');
                navLinksMenu.classList.toggle('mobile-open');
            };
            // Cerrar menú al hacer click en un botón de nav
            navLinksMenu.querySelectorAll('.nav-btn, .nav-link').forEach(btn => {
                btn.addEventListener('click', () => {
                    hamburger.classList.remove('open');
                    navLinksMenu.classList.remove('mobile-open');
                });
            });
        }
    }

    function performSearchAndFilter() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedCountry = countryFilter.value;
        const selectedTag = document.getElementById('tag-filter')?.value || '';
        const countryFilterName = selectedCountry !== "" ? selectedCountry : "Niveles Oficiales";

        const filteredLevels = allLevels.filter(level => {
            const matchesCountry = selectedCountry === "" || level.records.some(rec => rec.country && rec.country.trim() === selectedCountry);
            const matchesTag = selectedTag === "" || level.tag === selectedTag;
            const matchesText = query === "" || 
                level.name.toLowerCase().includes(query) || 
                level.author.toLowerCase().includes(query) ||
                level.records.some(rec => rec.user.toLowerCase().includes(query)) ||
                (level.records.some(rec => rec.country && rec.country.toLowerCase().includes(query)));
            return matchesCountry && matchesTag && matchesText;
        });

        if (activeView === 'lista') {
            const listTitle = document.querySelector('.list-title');
            if (listTitle) {
                const tagSelect = document.getElementById('tag-filter');
                const tagValue = tagSelect ? tagSelect.value : '';
                const tagName = tagValue ? tagSelect.options[tagSelect.selectedIndex].text : '';
                
                let titleText = countryFilterName; 
                if (tagName) titleText += ` — ${tagName}`;
                
                // Conservar el dropdown dentro del título
                const dropdown = document.getElementById('tag-filter');
                listTitle.textContent = titleText;
                if (dropdown) listTitle.appendChild(dropdown);
            }

            renderSidebar(filteredLevels);
            
            const currentDetailPanel = document.getElementById('level-detail-panel');
            if (filteredLevels.length > 0) {
                displayLevelDetails(filteredLevels[0]);
            } else if (currentDetailPanel) {
                currentDetailPanel.innerHTML = '<div style="padding:2rem; text-align:center;">Sin resultados.</div>';
            }
        } else if (activeView === 'leaderboard') {
            renderLeaderboardView();
        }
    }

    const viewHandlers = {
        lista: () => {
            mainContent.innerHTML = `
                <aside class="sidebar-list">
                    <div class="list-title">Niveles Oficiales</div>
                    <div class="levels-container" id="levels-list"></div>
                </aside>
                <section class="detail-container" id="level-detail-panel"></section>`;
            
            performSearchAndFilter(); 
        }
    };

    init();
});
