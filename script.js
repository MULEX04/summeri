/**
 * script.js
 * ---------
 * Frontend logic for the TextRank Summarizer.
 * Communicates with the Flask backend at http://127.0.0.1:5000/summarize
 */

document.addEventListener('DOMContentLoaded', () => {
    // ── Element references ────────────────────────────────────────────────
    const inputText      = document.getElementById('inputText');
    const wordCountBadge = document.getElementById('wordCountBadge');
    const wordCountText  = document.getElementById('wordCountText');
    const ratioSlider    = document.getElementById('ratioSlider');
    const ratioDisplay   = document.getElementById('ratioDisplay');
    const btnClear       = document.getElementById('btnClear');
    const btnCopy        = document.getElementById('btnCopy');
    const btnRingkas     = document.getElementById('btnRingkas');
    const outputText     = document.getElementById('outputText');
    const toast          = document.getElementById('toast');
    const toastMsg       = document.getElementById('toastMsg');
    const statsBar       = document.getElementById('statsBar');

    const MAX_WORDS  = 500;
    const API_URL    = 'http://127.0.0.1:5000/summarize';

    // ── Word counter ──────────────────────────────────────────────────────
    inputText.addEventListener('input', updateWordCount);

    function countWords(text) {
        return text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
    }

    function updateWordCount() {
        const count = countWords(inputText.value);
        wordCountText.textContent = `${count} / ${MAX_WORDS} words`;
        wordCountBadge.classList.toggle('exceeded', count > MAX_WORDS);
    }

    // ── Slider ────────────────────────────────────────────────────────────
    ratioSlider.addEventListener('input', () => {
        ratioDisplay.textContent = `${ratioSlider.value}%`;
    });

    // ── Reset button ──────────────────────────────────────────────────────
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            inputText.value = '';
            outputText.value = '';
            if (statsBar) statsBar.classList.add('hidden');
            updateWordCount();
        });
    }

    // ── Copy button ───────────────────────────────────────────────────────
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const content = outputText.value.trim();
            if (!content) {
                showToast('Summary is empty!', 'warn');
                return;
            }
            navigator.clipboard.writeText(content).then(() => {
                showToast('Copied to clipboard!', 'success');
            });
        });
    }

    // ── Summarize button ──────────────────────────────────────────────────
    document.getElementById('summarizerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await runSummarize();
    });

    async function runSummarize() {
        const text  = inputText.value.trim();
        const ratio = parseInt(ratioSlider.value, 10) / 100;

        // Client-side validation
        if (!text) {
            showToast('Please enter some text first.', 'warn');
            return;
        }
        if (countWords(text) > MAX_WORDS) {
            showToast(`Text exceeds ${MAX_WORDS} words.`, 'warn');
            return;
        }

        // UI: loading state
        setLoading(true);
        outputText.value = '';
        if (statsBar) statsBar.classList.add('hidden');

        try {
            const response = await fetch(API_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ text, ratio }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                showToast(data.error || 'Server error.', 'warn');
                outputText.value = '';
                return;
            }

            // Display summary
            outputText.value = data.summary;

            // Display stats
            if (statsBar) {
                document.getElementById('statOriginal').textContent = data.original_sents;
                document.getElementById('statKept').textContent     = data.summary_sents;
                document.getElementById('statRatio').textContent    = `${Math.round(ratio * 100)}%`;
                statsBar.classList.remove('hidden');
            }

            showToast('Summary generated!', 'success');

        } catch (err) {
            showToast('Cannot connect to the server. Is app.py running?', 'warn');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }

    // ── Loading state helper ──────────────────────────────────────────────
    function setLoading(isLoading) {
        btnRingkas.disabled = isLoading;
        const icon = btnRingkas.querySelector('i');
        const span = btnRingkas.querySelector('span');
        if (isLoading) {
            if (icon) icon.setAttribute('data-lucide', 'loader');
            if (span) span.textContent = 'Processing…';
            btnRingkas.classList.add('loading');
        } else {
            if (icon) icon.setAttribute('data-lucide', 'zap');
            if (span) span.textContent = 'Summarize';
            btnRingkas.classList.remove('loading');
        }
        lucide.createIcons();
    }

    // ── Toast notification ────────────────────────────────────────────────
    let toastTimer = null;
    function showToast(msg, type = 'success') {
        toastMsg.textContent = msg;
        toast.className = `toast ${type}`;          // reset classes
        toast.classList.remove('hidden');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.add('hidden');
        }, 2800);
    }
});
