(function () {
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

    var cards = $$('#viewGrid .pcard');
    var rows = $$('#sizeTable tbody tr');
    var state = { cat: '', q: '', brands: [], load: null, view: 'grid' };

    // ---------- filters ----------
    function matches(el) {
        if (state.cat && el.dataset.cat !== state.cat) return false;
        if (state.q) {
            var words = state.q.split(/\s+/);
            for (var i = 0; i < words.length; i++) if (el.dataset.text.indexOf(words[i]) === -1) return false;
        }
        if (state.brands.length) {
            var b = el.dataset.brands ? el.dataset.brands.split('|') : [];
            if (!state.brands.some(function (x) { return b.indexOf(x) !== -1; })) return false;
        }
        if (state.load) {
            if (el.dataset.min === '') return false;
            var min = parseFloat(el.dataset.min), max = parseFloat(el.dataset.max);
            if (max < state.load[0] || min >= state.load[1]) return false;
        }
        return true;
    }

    function apply() {
        var nCards = 0, nRows = 0;
        cards.forEach(function (c) { var ok = matches(c); c.hidden = !ok; if (ok) nCards++; });
        rows.forEach(function (r) { var ok = matches(r); r.hidden = !ok; if (ok) nRows++; });
        var n = state.view === 'grid' ? nCards : nRows;
        $('#pCount').textContent = n;
        $('#pTitleCount').textContent = nCards;
        $('#pEmpty').classList.toggle('hidden', n !== 0);
        var active = $('.f-cat[data-cat="' + state.cat + '"]');
        $('#pTitle').textContent = state.cat && active ? active.firstChild.textContent.trim() : 'Tất cả sản phẩm';
        try {
            var url = new URL(location.href);
            if (state.cat) url.searchParams.set('cat', state.cat); else url.searchParams.delete('cat');
            history.replaceState(null, '', url.pathname + url.search + location.hash);
        } catch (e) { /* ignore */ }
    }

    $$('.f-cat').forEach(function (btn) {
        btn.addEventListener('click', function () {
            $$('.f-cat').forEach(function (b) { b.classList.remove('is-active'); });
            btn.classList.add('is-active');
            state.cat = btn.dataset.cat;
            apply();
            if (window.innerWidth < 1024) $('#list-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    $('#pSearch').addEventListener('input', function (e) { state.q = e.target.value.trim().toLowerCase(); apply(); });
    $$('.f-brand').forEach(function (cb) {
        cb.addEventListener('change', function () {
            state.brands = $$('.f-brand').filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
            apply();
        });
    });
    $$('.f-load').forEach(function (r) {
        r.addEventListener('change', function () { state.load = r.value.split('-').map(Number); apply(); });
    });
    $('#fReset').addEventListener('click', function () {
        state = { cat: '', q: '', brands: [], load: null, view: state.view };
        $('#pSearch').value = '';
        $$('.f-brand, .f-load').forEach(function (x) { x.checked = false; });
        $$('.f-cat').forEach(function (b) { b.classList.toggle('is-active', b.dataset.cat === ''); });
        apply();
    });
    $('#filterToggle').addEventListener('click', function () {
        var open = $('#filterPanel').classList.toggle('hidden') === false;
        this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // ---------- view toggle ----------
    function setView(v) {
        state.view = v;
        $('#viewGrid').classList.toggle('hidden', v !== 'grid');
        $('#viewSize').classList.toggle('hidden', v !== 'size');
        $$('.view-btn').forEach(function (b) {
            var on = b.dataset.view === v;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        apply();
    }
    $$('.view-btn, .view-link').forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.view); }); });

    // size table product link → jump to its card in grid view
    $$('#sizeTable a[href^="#sp-"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            setView('grid');
            var card = $(a.getAttribute('href'));
            if (card && card.hidden) { $('#fReset').click(); }
            if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); flash(card); }
        });
    });
    function flash(el) { el.classList.add('ring-2', 'ring-amos-amber'); setTimeout(function () { el.classList.remove('ring-2', 'ring-amos-amber'); }, 1600); }

    // ---------- size modal ----------
    var modal = $('#sizeModal');
    var lastFocus = null;
    function openSizes(id, trigger) {
        var tpl = document.getElementById('tbl-' + id);
        if (!tpl) return;
        lastFocus = trigger;
        $('#sizeModalName').textContent = tpl.dataset.name;
        $('#sizeModalTitle').textContent = tpl.dataset.title;
        $('#sizeModalNote').textContent = tpl.dataset.note;
        $('#sizeModalLink').href = tpl.dataset.link;
        var body = $('#sizeModalBody');
        body.innerHTML = '';
        var wrap = document.createElement('div');
        wrap.className = 'relative overflow-x-auto rounded-md border border-amos-line';
        wrap.appendChild(tpl.content.cloneNode(true));
        body.appendChild(wrap);
        modal.classList.remove('hidden'); modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        $('.modal-close', modal).focus();
    }
    function closeSizes() {
        modal.classList.add('hidden'); modal.classList.remove('flex');
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }
    $$('.size-open').forEach(function (b) { b.addEventListener('click', function () { openSizes(b.dataset.id, b); }); });
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('.modal-close')) closeSizes(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeSizes(); });

    // "Xem trực tuyến" opens the catalogue lightbox at page 1
    var start = $('.lightbox-start');
    if (start) start.addEventListener('click', function (e) { var first = $('.cat-strip a.lightbox'); if (first) { e.preventDefault(); first.click(); } });

    // ---------- init ----------
    try {
        var cat = new URLSearchParams(location.search).get('cat');
        var btn = cat && $('.f-cat[data-cat="' + cat + '"]');
        if (btn) { $$('.f-cat').forEach(function (b) { b.classList.remove('is-active'); }); btn.classList.add('is-active'); state.cat = cat; }
    } catch (e) { /* ignore */ }
    apply();
    if (location.hash.indexOf('#sp-') === 0) { var c = $(location.hash); if (c) { c.hidden = false; setTimeout(function () { c.scrollIntoView({ block: 'center' }); flash(c); }, 100); } }
})();
