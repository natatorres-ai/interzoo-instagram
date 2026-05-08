/* ===================================================
   INTERZOO ANDORRA - Generador de Contingut Instagram
   Connecta amb l'API d'OpenAI (gpt-4.1-nano)
   =================================================== */

(function () {
    'use strict';

    const apiInput = document.getElementById('api-key-input');
    const btnSaveKey = document.getElementById('btn-save-key');
    const apiStatusMsg = document.getElementById('api-status-msg');
    const btnGenerate = document.getElementById('btn-generate');
    const loader = document.getElementById('loader');
    const resultsArea = document.getElementById('results-area');
    const dailyBrief = document.getElementById('daily-brief');

    const STORAGE_KEY = 'interzoo_openai_key';
    const RECENT_IDEAS_KEY = 'interzoo_recent_ideas';
    const MAX_RECENT_IDEAS = 28;
    let apiKey = '';

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        apiKey = saved;
        apiInput.value = saved;
        setKeyStatus('success', '✓ Clau desada. Ja pots generar idees.');
        enableGenerate();
    }

    btnSaveKey.addEventListener('click', () => {
        const val = apiInput.value.trim();
        if (!val.startsWith('sk-') || val.length < 20) {
            setKeyStatus('error', '✗ La clau no sembla vàlida. Ha de començar per sk-…');
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

    btnGenerate.addEventListener('click', generateIdeas);

    async function generateIdeas() {
        if (!apiKey) return;

        setLoading(true);
        resultsArea.innerHTML = '';

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4.1-nano',
                    temperature: 1.05,
                    top_p: 0.95,
                    presence_penalty: 0.55,
                    frequency_penalty: 0.55,
                    max_tokens: 3600,
                    messages: [
                        { role: 'system', content: buildSystemPrompt() },
                        { role: 'user', content: buildUserPrompt() }
                    ]
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.error?.message || `Error HTTP ${response.status}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || '';
            const ideas = parseIdeas(text);
            renderIdeas(ideas);
            rememberIdeas(ideas);
        } catch (e) {
            renderError(e.message);
        } finally {
            setLoading(false);
        }
    }

    function buildUserPrompt() {
        const context = dailyBrief.value.trim();
        const recent = getRecentIdeas();
        const today = new Date().toLocaleDateString('ca-AD', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `Genera 7 idees noves per al perfil d'Instagram d'Interzoo Andorra.
Data d'avui: ${today}.
Context o tema opcional de la persona usuària: ${context || 'cap tema concret; escull una barreja variada i útil'}.
Idees recents que has d'evitar repetir o versionar massa:
${recent.length ? recent.map((item, i) => `${i + 1}. ${item}`).join('\n') : 'Encara no hi ha historial.'}

Prioritza idees que sonin concretes, observades i publicables. No facis una llista genèrica de consells de botiga de mascotes.`;
    }

    function buildSystemPrompt() {
        return `Ets l'estratega de contingut d'Instagram d'Interzoo Andorra, una botiga especialitzada en animals de companyia.

IDENTITAT DE MARCA
La sensació central ha de ser: "Aquí entenen els animals".
No ha de sonar a: "Aquí intenten vendre'm coses".
Interzoo transmet benestar animal, coneixement, calma, confiança, assessorament expert i proximitat local.
La venda és una conseqüència de la confiança, mai el centre del post.

IDIOMA I TO
Sempre en català natural. Frases curtes, elegants i clares.
Tono adult, proper, professional, emocional però sobri. Reflexiu sense ser cursi.
No facis humor absurd, no infantilitzis els animals i no moralitzis.
Evita: OFERTA, compra ara, súper descompte, urgent, increïble, gatitos, perritos, peluditos, emojis excessius, frases motivacionals buides.

PILARS DE CONTINGUT
Barreja aquests pilars sense repetir angles:
- Educatiu útil: comportament, llenguatge corporal, olfacte, rutines, estimulació mental, alimentació, convivència, enriquiment ambiental, benestar emocional.
- Emocional/reflexiu: ritme dels animals, calma, observació, vincle, convivència conscient, harmonia a casa.
- Curiositat amb valor: races, conducta canina o felina, bigotis, ulls, instints, hàbits naturals, coses poc conegudes però útils.
- Estacional/contextual: fred, calor, neu, vacances, Nadal, Reis, Setmana Santa, canvis de rutina a Andorra, sempre des del benestar quotidià.
- Servei/confiança: assessorament, nutrició especialitzada, WhatsApp, entrega a domicili, experiència de botiga, sense sonar comercial.

FORMATS DISPONIBLES
Cada una de les 7 idees ha de tenir un format diferent o molt variat entre aquests:
- Post estàtic reflexiu
- Carrusel educatiu
- Reel observacional de 5-7 segons
- Story amb pregunta subtil
- Mini guia pràctica
- Sabies que...?
- Error freqüent explicat amb calma
- Checklist suau
- Mite vs realitat
- Moment de botiga o servei

REGLA ANTI-REPETICIÓ
No generis set variacions del mateix tema. Dins la mateixa resposta, cada idea ha de canviar com a mínim tres coses: animal, angle, format, situació quotidiana o emoció.
Evita repetir massa: alimentació, passeig, rutina, confiança, assessorament. Si apareixen, que siguin amb una mirada específica i nova.

ANIMALS
Prioritat habitual: gossos, gats, aquari/peixos, rosegadors, ocells. No oblidis gats ni animals petits. Les races poden aparèixer quan aporten coneixement real, no decoració.

VISUALS
Per cada idea, inclou una proposta visual realista:
- foto o vídeo amb llum natural
- interior càlid o exterior andorrà quotidià
- fons neutres
- profunditat de camp suau
- estètica lifestyle tranquil·la
- emocions reals
Evita caricatura, colors cridaners, imatges artificials o publicitàries.

EMOJIS
Màxim 2 emojis per post. Si no calen, cap. Han de ser discrets i naturals.

HASHTAGS
8-12 hashtags al final. Barreja català, castellà i anglès. Inclou sempre #InterzooAndorra i #BenestarAnimal.

FORMAT DE RESPOSTA OBLIGATORI
Retorna exactament 7 blocs i cap text fora dels blocs. Mantén aquestes etiquetes exactes:

IDEA 1
Títol: [frase curta, concreta, no genèrica]
Tipus: [Educatiu | Reflexiu | Curiositat | Temporal | Servei]
Animal: [Gos | Gat | Aquari | Rosegador | Ocell | General]
Format: [un dels formats disponibles]
Contingut: [què mostrar o explicar, en 2-3 frases concretes]
Visual: [prompt visual breu per crear foto o vídeo realista]
Post:
[text complet llest per publicar. 3-6 línies màxim abans dels hashtags. Comença directament amb una frase amb força. Tanca el text amb una pregunta curta o reflexió. Després deixa una línia en blanc i posa els hashtags]

IDEA 2
... fins a IDEA 7`;
    }

    function parseIdeas(raw) {
        const ideas = [];
        const blocks = raw.split(/IDEA\s+\d+/i).filter(b => b.trim());

        for (const block of blocks) {
            const title = extract(block, /Títol\s*:\s*(.+)/i);
            const type = extract(block, /Tipus\s*:\s*(.+)/i);
            const animal = extract(block, /Animal\s*:\s*(.+)/i);
            const format = extract(block, /Format\s*:\s*(.+)/i);
            const content = extract(block, /Contingut\s*:\s*([\s\S]+?)(?=Visual\s*:|Post\s*:|$)/i);
            const visual = extract(block, /Visual\s*:\s*([\s\S]+?)(?=Post\s*:|$)/i);
            const postMatch = block.match(/Post\s*:\s*\n([\s\S]+)/i);
            const post = postMatch ? postMatch[1].trim() : '';

            if (title) {
                ideas.push({
                    title: title.trim(),
                    type: type.trim(),
                    animal: animal.trim(),
                    format: format.trim(),
                    content: content.trim(),
                    visual: visual.trim(),
                    post,
                });
            }
        }

        return ideas.slice(0, 7);
    }

    function extract(text, regex) {
        const m = text.match(regex);
        return m ? m[1].trim() : '';
    }

    function renderIdeas(ideas) {
        if (!ideas.length) {
            renderError('No s\'han pogut interpretar les idees generades. Torna-ho a provar.');
            return;
        }
        ideas.forEach((idea, i) => {
            resultsArea.appendChild(buildCard(idea, i + 1));
        });
    }

    function buildCard(idea, index) {
        const typeKey = classifyType(idea.type);
        const typeLabel = idea.type || 'General';
        const animalEmoji = animalIcon(idea.animal);
        const { postBody, hashtags } = splitPost(idea.post);

        const card = document.createElement('article');
        card.className = 'idea-card';
        card.setAttribute('aria-label', `Idea ${index}: ${idea.title}`);

        card.innerHTML = `
      <div class="card-accent-bar ${typeKey}"></div>

      <div class="card-top">
        <span class="card-index">Idea ${index}</span>
        <div class="card-badges">
          <span class="badge badge-type ${typeKey}">${escapeHtml(typeLabel)}</span>
          <span class="badge badge-animal">${animalEmoji} ${escapeHtml(idea.animal || 'General')}</span>
          ${idea.format ? `<span class="badge badge-format">${escapeHtml(idea.format)}</span>` : ''}
        </div>
      </div>

      <h2 class="card-title">${escapeHtml(idea.title)}</h2>
      <p class="card-body">${escapeHtml(idea.content)}</p>

      ${idea.post ? `
      <div class="post-preview">
        <div class="post-preview-header">
          <span class="post-preview-label">📋 Post llest per publicar</span>
        </div>
        <div class="post-body">${escapeHtmlNl(postBody)}</div>
        ${hashtags ? `<div class="post-hashtags">${escapeHtml(hashtags)}</div>` : ''}
      </div>
      ` : ''}

      ${idea.visual ? `
      <div class="visual-prompt">
        <div class="visual-prompt-header">
          <span class="visual-prompt-label">Idea visual</span>
        </div>
        <div class="visual-prompt-body">${escapeHtml(idea.visual)}</div>
      </div>
      ` : ''}

      <div class="card-footer">
        <button class="btn-copy" data-kind="post" aria-label="Copia el post ${index}">
          ${copyIcon()} Copia el post
        </button>
        ${idea.visual ? `<button class="btn-copy" data-kind="visual" aria-label="Copia la idea visual ${index}">${copyIcon()} Copia visual</button>` : ''}
      </div>
    `;

        const postButton = card.querySelector('[data-kind="post"]');
        postButton.addEventListener('click', () => copyText(idea.post || idea.title, postButton, 'Copia el post'));

        const visualButton = card.querySelector('[data-kind="visual"]');
        if (visualButton) {
            visualButton.addEventListener('click', () => copyText(idea.visual, visualButton, 'Copia visual'));
        }

        return card;
    }

    function splitPost(post) {
        if (!post) return { postBody: '', hashtags: '' };
        const lines = post.split('\n');
        const hashtagLines = [];
        const bodyLines = [];
        let inHashtags = false;

        for (const line of lines) {
            const trimmed = line.trim();
            const words = trimmed.split(/\s+/).filter(Boolean);
            const hashWords = words.filter(w => w.startsWith('#')).length;
            if (hashWords > 0 && hashWords >= words.length * 0.6) {
                inHashtags = true;
            }
            if (inHashtags) {
                hashtagLines.push(trimmed);
            } else {
                bodyLines.push(line);
            }
        }

        return {
            postBody: bodyLines.join('\n').trim(),
            hashtags: hashtagLines.join(' ').trim(),
        };
    }

    function classifyType(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('educat')) return 'edu';
        if (t.includes('reflex') || t.includes('emoc')) return 'ref';
        if (t.includes('curiosit')) return 'cur';
        if (t.includes('tempor') || t.includes('estacional')) return 'season';
        if (t.includes('marca') || t.includes('servei')) return 'brand';
        return 'edu';
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

    function rememberIdeas(ideas) {
        if (!ideas.length) return;
        const current = getRecentIdeas();
        const fresh = ideas.map(idea => {
            const parts = [idea.title, idea.type, idea.animal, idea.format].filter(Boolean);
            return parts.join(' · ');
        });
        const merged = fresh.concat(current).filter(Boolean);
        const unique = [...new Set(merged)].slice(0, MAX_RECENT_IDEAS);
        localStorage.setItem(RECENT_IDEAS_KEY, JSON.stringify(unique));
    }

    function getRecentIdeas() {
        try {
            const parsed = JSON.parse(localStorage.getItem(RECENT_IDEAS_KEY) || '[]');
            return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_IDEAS) : [];
        } catch (_) {
            return [];
        }
    }

    function copyText(text, btn, originalLabel) {
        navigator.clipboard.writeText(text).then(() => {
            btn.classList.add('copied');
            btn.innerHTML = `${checkIcon()} Copiat!`;
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.innerHTML = `${copyIcon()} ${originalLabel}`;
            }, 2200);
        }).catch(() => {
            btn.textContent = 'Error';
        });
    }

    function copyIcon() {
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    }

    function checkIcon() {
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
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

    function escapeHtmlNl(str) {
        return escapeHtml(str).replace(/\n/g, '<br>');
    }

    function setLoading(on) {
        if (on) {
            loader.classList.add('visible');
            loader.setAttribute('aria-hidden', 'false');
            btnGenerate.disabled = true;
            btnGenerate.querySelector('.btn-label').textContent = 'Generant…';
        } else {
            loader.classList.remove('visible');
            loader.setAttribute('aria-hidden', 'true');
            btnGenerate.disabled = !apiKey;
            btnGenerate.querySelector('.btn-label').textContent = 'Genera 7 idees per avui';
        }
    }

    function setKeyStatus(type, msg) {
        apiStatusMsg.textContent = msg;
        apiStatusMsg.className = 'api-hint ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : '');
    }

    function enableGenerate() { btnGenerate.disabled = false; }
    function disableGenerate() { btnGenerate.disabled = true; apiKey = ''; }

})();
