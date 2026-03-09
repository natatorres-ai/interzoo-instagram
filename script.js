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
                    temperature: 0.85,
                    max_tokens: 2600,
                    messages: [
                        { role: 'system', content: buildSystemPrompt() },
                        { role: 'user', content: 'Genera les 7 idees de contingut per avui.' }
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
    function buildSystemPrompt() {
        return `Ets un generador expert de contingut per a Instagram per al perfil d'Interzoo Andorra.
Interzoo és una botiga especialitzada en animals de companyia a Andorra (alimentació, accessoris i assessorament).

VALORS: benestar animal, responsabilitat, coneixement, calma, confiança, proximitat local.
OBJECTIU: posicionar-se com a experts, generar confiança. La venda és una conseqüència, NO l'objectiu.

IDIOMA: Sempre en català. Frases curtes, naturals, correctes però no formals. Proper i tranquil.

ESTIL: Proper · Tranquil · Elegant · Reflexiu · Madur · Confiable.
MAI: infantil · exagerat · comercial · cridaner · "venedor".
NO USAR: "OFERTA", "COMPRA ARA", "SUPER DESCOMPTE", diminutius tipus "gatitos/perritos".

DISTRIBUCIÓ OBLIGATÒRIA (entre les 7 idees):
- 2 Educatives (alimentació, rutines, salut preventiva, estimulació, comportament)
- 2 Reflexives/Emocionals (relació persona-animal, ritme, convivència, comprensió)
- 1-2 Curiositats (conducta felina, llenguatge caní, hàbits naturals, coses poc conegudes)
- 1-2 Marca/Servei (sense vendre: assessorament, nutrició, experiència, confiança)

ANIMALS: Gossos > Gats > Aquari > Rosegadors/Ocells (ocasional)

EMOJIS PERMITITS (poc, amb criteri i elegància):
- Animals: 🐾 🐕 🐈 🐟 🐇
- Natura/calma: 🌿 🍃 ☀️ 🌙 💧
- Coneixement: 💡 📌
- Cor/emoció: 🤍 💚
- Màxim 3 emojis per post. MAI emojis cridaners ni excessius.

FORMAT DE RESPOSTA — estrictament aquest, sense cap altre text fora de l'estructura:

IDEA 1
Títol: [frase curta atractiva]
Contingut: [explicació breu de què mostrar o explicar, 2-3 frases]
Tipus: Educatiu
Animal: Gos
Post:
[text complet del post d'Instagram, llest per publicar, en català, amb emojis apropiats i hashtags al final. 3-5 línies màxim de text + 8-12 hashtags rellevants en català/castellà/anglès mezclats. El text ha de sonar natural, proper, expert. NO és un anunci. Acaba sempre amb una pregunta reflexiva o invitació subtil.]

IDEA 2
Títol: ...
Contingut: ...
Tipus: Reflexiu
Animal: Gat
Post:
[text complet...]

[...fins a IDEA 7]

Regles del Post:
- Comença directament amb el missatge, sense "Hola!" ni introducció buida
- Màxim 3 emojis integrats de forma natural al text
- Separa els hashtags del text amb una línia en blanc
- 8-12 hashtags: combina català, castellà i anglès
- Inclou sempre #InterzooAndorra i #BenestArAnimal
- Acaba el text (no els hashtags) amb una pregunta curta o reflexió
- Cada post ha de sonar diferent dels altres`;
    }

    // ── Parse ─────────────────────────────────────────────
    function parseIdeas(raw) {
        const ideas = [];
        const blocks = raw.split(/IDEA\s+\d+/i).filter(b => b.trim());

        for (const block of blocks) {
            const title = extract(block, /Títol\s*:\s*(.+)/i);
            const content = extract(block, /Contingut\s*:\s*([\s\S]+?)(?=Tipus\s*:|$)/i);
            const type = extract(block, /Tipus\s*:\s*(.+)/i);
            const animal = extract(block, /Animal\s*:\s*(.+)/i);
            // Post: everything after "Post:\n" until end of block
            const postMatch = block.match(/Post\s*:\s*\n([\s\S]+)/i);
            const post = postMatch ? postMatch[1].trim() : '';

            if (title) {
                ideas.push({
                    title: title.trim(),
                    content: content.trim(),
                    type: type.trim(),
                    animal: animal.trim(),
                    post: post,
                });
            }
        }

        return ideas;
    }

    function extract(text, regex) {
        const m = text.match(regex);
        return m ? m[1].trim() : '';
    }

    // ── Render ────────────────────────────────────────────
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

        // Split post into text body and hashtags
        const { postBody, hashtags } = splitPost(idea.post);

        const card = document.createElement('article');
        card.className = 'idea-card';
        card.setAttribute('aria-label', `Idea ${index}: ${idea.title}`);

        card.innerHTML = `
      <div class="card-accent-bar ${typeKey}"></div>

      <div class="card-top">
        <span class="card-index">Idea ${index}</span>
        <div class="card-badges">
          <span class="badge badge-type ${typeKey}">${typeLabel}</span>
          <span class="badge badge-animal">${animalEmoji} ${idea.animal || 'General'}</span>
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

      <div class="card-footer">
        <button class="btn-copy" data-index="${index}" aria-label="Copia el post ${index}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copia el post
        </button>
      </div>
    `;

        card.querySelector('.btn-copy').addEventListener('click', () => copyPost(idea.post || idea.title, card.querySelector('.btn-copy')));
        return card;
    }

    // Split the post into body text and hashtag line(s)
    function splitPost(post) {
        if (!post) return { postBody: '', hashtags: '' };
        const lines = post.split('\n');
        const hashtagLines = [];
        const bodyLines = [];
        let inHashtags = false;

        for (const line of lines) {
            const trimmed = line.trim();
            // A line is "hashtag only" if most of its words start with #
            const words = trimmed.split(/\s+/);
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
          Copia el post
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
