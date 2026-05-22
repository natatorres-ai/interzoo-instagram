/* ===================================================
   INTERZOO ANDORRA — Generador de Contingut Instagram
   Connecta amb l'API d'OpenAI (gpt-4.1-nano)
   =================================================== */

(function () {
    'use strict';

    // ── DOM refs ──────────────────────────────────────────
    const apiInput = document.getElementById('api-key-input');
    const btnSaveKey = document.getElementById('btn-save-key');
    const apiStatusMsg = document.getElementById('api-status-msg');
    const btnGenerate = document.getElementById('btn-generate');
    const loader = document.getElementById('loader');
    const resultsArea = document.getElementById('results-area');

    // New DOM refs
    const animalSelector = document.getElementById('animal-selector');
    const generateHint = document.getElementById('generate-hint');
    const postActions = document.getElementById('post-actions');
    const btnGenerateNew = document.getElementById('btn-generate-new');
    const btnChangeAnimal = document.getElementById('btn-change-animal');

    // ── State ─────────────────────────────────────────────
    const STORAGE_KEY = 'interzoo_openai_key';
    let apiKey = '';

    // ── Init ──────────────────────────────────────────────
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        apiKey = saved;
        apiInput.value = saved;
        setKeyStatus('success', '✓ Clau desada. Ja pots generar idees.');
        enableGenerate();
    }

    // ── Save key ──────────────────────────────────────────
    btnSaveKey.addEventListener('click', () => {
        const val = apiInput.value.trim();
        if (!val.startsWith('sk-') || val.length < 20) {
            setKeyStatus('error', '✗ La clau no sembla vàlida. Ha de começar per sk-…');
            disableGenerate();
            return;
        }
        apiKey = val;
        localStorage.setItem(STORAGE_KEY, val);
        setKeyStatus('success', '✓ Clau desada correctament.');
        enableGenerate();
    });

    apiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnSaveKey.click();
    });

    // ── Generate ──────────────────────────────────────────
    btnGenerate.addEventListener('click', generateIdeas);
    btnGenerateNew.addEventListener('click', generateIdeas);
    
    btnChangeAnimal.addEventListener('click', () => {
        // Hide results and actions, show selector
        resultsArea.innerHTML = '';
        postActions.style.display = 'none';
        animalSelector.style.display = 'flex';
        generateHint.style.display = 'block';
    });

    async function generateIdeas() {
        if (!apiKey) return;

        // Hide selector if visible
        animalSelector.style.display = 'none';
        generateHint.style.display = 'none';
        postActions.style.display = 'none';

        setLoading(true);
        resultsArea.innerHTML = '';

        // Get selected animal
        const selectedRadio = document.querySelector('input[name="animal_type"]:checked');
        const animalType = selectedRadio ? selectedRadio.value : 'Qualsevol';

        const tematiques = [
            "salut dental", "envelliment en gossos i gats", "jocs d'olfacte", "comportament felí nocturn",
            "socialització de cadells", "al·lèrgies i sensibilitats alimentàries", "viatjar amb animals",
            "cures del pelatge a l'estiu/hivern", "enriquiment per a gats d'interior", "control del pes ideal",
            "estrès i ansietat per separació", "iniciació a l'aquariofília", "cures de petits mamífers",
            "la importància de la hidratació", "entendre el llenguatge corporal caní", "prevenció de puces i paparres",
            "el canvi de pèl", "joguines interactives", "gossos reactius", "alimentació humida vs seca"
        ];
        const randomThemes = tematiques.sort(() => 0.5 - Math.random()).slice(0, 3).join(", ");

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4.1-nano',
                    temperature: 0.85,
                    max_tokens: 2600,
                    messages: [
                        { role: 'system', content: buildSystemPrompt(animalType) },
                        { role: 'user', content: `Genera UNA proposta completa de post per a Instagram sobre ${animalType.toUpperCase()}. Per garantir varietat, inspira't en aquests temes: ${randomThemes}. IMPORTANT: Fes-la diferent a generacions anteriors. (Seed: ${Math.random().toString(36).substring(2, 10)})` }
                    ]
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.error?.message || `Error HTTP ${response.status}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || '';
            renderIdeas(parseIdeas(text));

        } catch (e) {
            renderError(e.message);
        } finally {
            setLoading(false);
        }
    }

    // ── Prompt ────────────────────────────────────────────
    function buildSystemPrompt(animalType) {
        return `Ets un generador expert de contingut per a Instagram per al perfil d'Interzoo Andorra.
Interzoo és una botiga especialitzada en animals de companyia a Andorra.

VALORS: benestar animal, responsabilitat, coneixement, calma, confiança, proximitat local.
OBJECTIU: posicionar-se com a experts, generar confiança.
ANIMAL OBJECTIU: ${animalType}

IDIOMA: Sempre en català. Frases curtes, naturals, correctes però no formals. Proper i tranquil.
ESTIL: Proper · Tranquil · Elegant · Reflexiu · Madur · Confiable.
MAI: infantil · exagerat · comercial · cridaner · "venedor". No usar "Compra ara", "Oferta", etc.

FORMAT DE RESPOSTA (Has de generar EXACTAMENT UNA proposta amb aquests camps):

Títol: [Un títol intern curt per identificar la idea]
Hook: [Una frase molt curta (màxim 6-8 paraules), potent i visual per posar sobre la imatge/vídeo. Ex: "Els gats també necessiten calma"]
Text:
[Text complet del post d'Instagram en català, educatiu, proper, sense massa llargada. Primera frase amb força, explicació breu, consell/reflexió, tancament amb Interzoo Andorra. Sense hashtags aquí.]
Hashtags: [8-15 hashtags barrejant català, castellà i anglès. Inclou obligatòriament #InterzooAndorra #BenestarAnimal]
Prompt Imatge: [Prompt en anglès per generar una imatge realista, llum natural, fons càlid/neutre, sense text, format vertical per Instagram]
Prompt Vídeo: [Prompt alternatiu en anglès per generar un vídeo de 5-7 segons, realista, natural per Instagram]`;
    }

    // ── Parse ─────────────────────────────────────────────
    function parseIdeas(raw) {
        const title = extract(raw, /Títol\s*:\s*(.+)/i);
        const hook = extract(raw, /Hook\s*:\s*(.+)/i);
        
        // Extract Text
        let text = '';
        const textMatch = raw.match(/Text\s*:\s*\n([\s\S]+?)(?=Hashtags\s*:|Prompt Imatge\s*:|$)/i) || raw.match(/Text\s*:\s*([\s\S]+?)(?=Hashtags\s*:|Prompt Imatge\s*:|$)/i);
        if (textMatch) text = textMatch[1].trim();

        const hashtags = extract(raw, /Hashtags\s*:\s*(.+)/i);
        const promptImatge = extract(raw, /Prompt Imatge\s*:\s*(.+)/i);
        const promptVideo = extract(raw, /Prompt Vídeo\s*:\s*(.+)/i) || extract(raw, /Prompt Video\s*:\s*(.+)/i);

        if (!title && !text) return [];

        return [{
            title,
            hook,
            text,
            hashtags,
            promptImatge,
            promptVideo
        }];
    }

    function extract(text, regex) {
        const m = text.match(regex);
        return m ? m[1].trim() : '';
    }

    // ── Render ────────────────────────────────────────────
    function renderIdeas(ideas) {
        if (!ideas || !ideas.length) {
            renderError('No s\'ha pogut interpretar la proposta generada. Torna-ho a provar.');
            return;
        }
        
        const idea = ideas[0];
        resultsArea.appendChild(buildCard(idea));
        
        // Show post actions
        postActions.style.display = 'flex';
    }

    function buildBlock(title, content, className = '') {
        if (!content) return '';
        const blockId = 'block-' + Math.random().toString(36).substr(2, 9);
        return `
        <div class="block-container">
            <div class="block-header">
                <span class="block-title">${title}</span>
                <button class="btn-copy" data-target="${blockId}" aria-label="Copia ${title}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copia
                </button>
            </div>
            <div class="block-content ${className}" id="${blockId}">${escapeHtmlNl(content)}</div>
        </div>`;
    }

    function buildCard(idea) {
        const card = document.createElement('article');
        card.className = 'idea-card';

        const selectedRadio = document.querySelector('input[name="animal_type"]:checked');
        const animalType = selectedRadio ? selectedRadio.value : 'Qualsevol';
        const animalEmoji = animalIcon(animalType);

        let html = `
      <div class="card-accent-bar brand"></div>
      <div class="card-top">
        <h2 class="card-title">${escapeHtml(idea.title || 'Proposta de Post')}</h2>
        <div class="card-badges">
          <span class="badge badge-animal">${animalEmoji} ${animalType}</span>
        </div>
      </div>
      <div class="card-blocks" style="margin-top: 1rem;">
    `;

        html += buildBlock('Hook per a Imatge/Vídeo', idea.hook, 'hook');
        html += buildBlock('Text del Post', idea.text, 'text');
        html += buildBlock('Hashtags', idea.hashtags, 'hashtags');
        html += buildBlock('Prompt Generació d\'Imatge', idea.promptImatge, 'prompt');
        html += buildBlock('Prompt Generació de Vídeo', idea.promptVideo, 'prompt');

        html += `</div>`;
        card.innerHTML = html;

        // Attach copy events
        const copyBtns = card.querySelectorAll('.btn-copy');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const contentNode = document.getElementById(targetId);
                if (contentNode) {
                    // Extract text content, converting <br> to newline
                    let textToCopy = contentNode.innerText;
                    copyPost(textToCopy, btn);
                }
            });
        });

        return card;
    }



    function animalIcon(animal) {
        const a = (animal || '').toLowerCase();
        if (a.includes('gos') || a.includes('dog')) return '🐕';
        if (a.includes('gat') || a.includes('cat')) return '🐈';
        if (a.includes('aquari') || a.includes('peix')) return '🐟';
        if (a.includes('rosegad') || a.includes('conill')) return '🐇';
        if (a.includes('ocell') || a.includes('au')) return '🐦';
        return '🐾';
    }

    function copyPost(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
            btn.classList.add('copied');
            btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copiat!
      `;
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copia
        `;
            }, 2500);
        }).catch(() => {
            btn.textContent = 'Error';
        });
    }

    function renderError(msg) {
        const el = document.createElement('div');
        el.className = 'error-card';
        el.innerHTML = `<strong>S'ha produït un error</strong>${escapeHtml(msg)}`;
        resultsArea.appendChild(el);
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Like escapeHtml but preserves newlines as <br>
    function escapeHtmlNl(str) {
        return escapeHtml(str).replace(/\n/g, '<br>');
    }

    // ── UI helpers ────────────────────────────────────────
    function setLoading(on) {
        if (on) {
            loader.classList.add('visible');
            loader.setAttribute('aria-hidden', 'false');
            btnGenerate.disabled = true;
            btnGenerate.querySelector('.btn-label').textContent = 'Generant…';
        } else {
            loader.classList.remove('visible');
            loader.setAttribute('aria-hidden', 'true');
            btnGenerate.disabled = false;
            btnGenerate.querySelector('.btn-label').textContent = 'Genera proposta';
        }
    }

    function setKeyStatus(type, msg) {
        apiStatusMsg.textContent = msg;
        apiStatusMsg.className = 'api-hint ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
    }

    function enableGenerate() { btnGenerate.disabled = false; }
    function disableGenerate() { btnGenerate.disabled = true; apiKey = ''; }

})();
