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

    // size table link → jump to card in grid view
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
        if (tpl.dataset.sized === '1') {
            var table = wrap.querySelector('table');
            $$('thead tr', table).forEach(function (tr, i) {
                var th = document.createElement('th');
                if (i === 0) { th.setAttribute('rowspan', table.tHead.rows.length); th.innerHTML = '<span class="sr-only">Báo giá</span>'; tr.appendChild(th); }
            });
            // size rows are generated in the same order as the source table rows
            var adds = $$('#sizeTable tbody .rfq-add').filter(function (b) { return b.dataset.key.indexOf(id + '::') === 0; });
            $$('tbody tr', table).forEach(function (tr, i) {
                var td = document.createElement('td');
                if (adds[i]) td.appendChild(adds[i].cloneNode(true));
                tr.appendChild(td);
            });
        }
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

    // ---------- RFQ list ----------
    var KEY = 'amos-rfq';
    var rfq = [];
    try { rfq = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { rfq = []; }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(rfq)); } catch (e) { /* ignore */ } }
    var panel = $('#rfqPanel');

    function rfqText() {
        var lines = rfq.map(function (it, i) { return (i + 1) + '. ' + it.name + (it.size ? ' – ' + it.size : '') + ' – SL: ' + it.qty; });
        var note = $('#rfqNote').value.trim();
        return 'Kính gửi Amos Việt Nam,\n\nVui lòng báo giá các sản phẩm sau:\n' + lines.join('\n') + (note ? '\n\nGhi chú: ' + note : '') + '\n\nTrân trọng.';
    }
    function render() {
        var n = rfq.reduce(function (s, it) { return s + 1; }, 0);
        $('#rfqCount').textContent = n;
        $('#rfqFab').classList.toggle('hidden', n === 0);
        $('#rfqFab').classList.toggle('inline-flex', n > 0);
        var list = $('#rfqList');
        list.innerHTML = '';
        if (!n) { list.innerHTML = '<li class="py-8 text-center text-sm text-amos-steel">Chưa có sản phẩm. Nhấn “Thêm vào báo giá” hoặc nút + ở bảng size.</li>'; }
        rfq.forEach(function (it, i) {
            var li = document.createElement('li');
            li.className = 'flex items-start gap-3 py-3';
            li.innerHTML = '<div class="min-w-0 flex-1"><p class="text-sm font-bold text-amos-deep"></p><p class="font-mono text-xs text-amos-steel"></p></div>' +
                '<input type="number" min="1" class="h-9 w-16 rounded border border-amos-line px-2 text-sm" aria-label="Số lượng">' +
                '<button type="button" class="h-9 w-9 rounded text-amos-steel hover:bg-amos-mist hover:text-red-600" aria-label="Xóa"><i class="fa-solid fa-trash-can"></i></button>';
            li.querySelector('p').textContent = it.name;
            li.querySelectorAll('p')[1].textContent = it.size || 'Thông số theo yêu cầu';
            var q = li.querySelector('input');
            q.value = it.qty;
            q.addEventListener('change', function () { it.qty = Math.max(1, parseInt(q.value, 10) || 1); q.value = it.qty; save(); updateMail(); });
            li.querySelector('button').addEventListener('click', function () { rfq.splice(i, 1); save(); render(); });
            list.appendChild(li);
        });
        updateMail();
    }
    function updateMail() {
        $('#rfqMail').href = 'mailto:cong.nguyen@amosgroup.com?subject=' + encodeURIComponent('Yêu cầu báo giá – amosvietnam.com') + '&body=' + encodeURIComponent(rfqText());
    }
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.rfq-add');
        if (!btn) return;
        var key = btn.dataset.key;
        var found = rfq.filter(function (it) { return it.key === key; })[0];
        if (found) found.qty++;
        else rfq.push({ key: key, name: btn.dataset.name, size: btn.dataset.size, qty: 1 });
        save(); render();
        var icon = btn.querySelector('i');
        if (icon) { icon.className = 'fa-solid fa-check text-xs'; setTimeout(function () { icon.className = 'fa-solid fa-plus text-xs'; }, 1200); }
        var fab = $('#rfqFab');
        fab.classList.remove('rfq-bump'); void fab.offsetWidth; fab.classList.add('rfq-bump');
    });
    function openPanel() { panel.classList.remove('hidden'); document.body.style.overflow = 'hidden'; $('.rfq-close', panel).focus(); }
    function closePanel() { panel.classList.add('hidden'); document.body.style.overflow = ''; $('#rfqFab').focus(); }
    $('#rfqFab').addEventListener('click', openPanel);
    panel.addEventListener('click', function (e) { if (e.target.closest('.rfq-close') || e.target.classList.contains('rfq-backdrop')) closePanel(); });
    $('#rfqNote').addEventListener('input', updateMail);
    $('#rfqClear').addEventListener('click', function () { rfq = []; save(); render(); });
    $('#rfqCopy').addEventListener('click', function () {
        var label = this.querySelector('span');
        var done = function () { label.textContent = 'Đã sao chép'; setTimeout(function () { label.textContent = 'Sao chép'; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(rfqText()).then(done, function () {});
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (!modal.classList.contains('hidden')) closeSizes();
        else if (!panel.classList.contains('hidden')) closePanel();
    });

    // "Xem trực tuyến" opens the catalogue lightbox at page 1
    var start = $('.lightbox-start');
    if (start) start.addEventListener('click', function (e) { var first = $('.cat-strip a.lightbox'); if (first) { e.preventDefault(); first.click(); } });

    // ---------- init ----------
    try {
        var cat = new URLSearchParams(location.search).get('cat');
        var btn = cat && $('.f-cat[data-cat="' + cat + '"]');
        if (btn) { $$('.f-cat').forEach(function (b) { b.classList.remove('is-active'); }); btn.classList.add('is-active'); state.cat = cat; }
    } catch (e) { /* ignore */ }
    render();
    apply();
    if (location.hash.indexOf('#sp-') === 0) { var c = $(location.hash); if (c) { c.hidden = false; setTimeout(function () { c.scrollIntoView({ block: 'center' }); flash(c); }, 100); } }
})();
