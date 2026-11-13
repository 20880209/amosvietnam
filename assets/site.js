(function () {
    var menuButton = document.getElementById('menuButton');
    var mobileMenu = document.getElementById('mobileMenu');
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function () {
            var open = mobileMenu.classList.toggle('hidden') === false;
            menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    // Quick filter for spec tables
    document.querySelectorAll('.table-filter').forEach(function (input) {
        var table = input.closest('div.rounded-md').querySelector('table');
        input.addEventListener('input', function () {
            var q = input.value.trim().toLowerCase();
            table.querySelectorAll('tbody tr').forEach(function (tr) {
                tr.classList.toggle('is-hidden', q !== '' && tr.textContent.toLowerCase().indexOf(q) === -1);
            });
        });
    });

    // Image lightbox
    var links = Array.prototype.slice.call(document.querySelectorAll('a.lightbox'));
    if (!links.length) return;
    var box = document.createElement('div');
    box.id = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button type="button" data-act="close" style="top:1rem;right:1rem" aria-label="Đóng">&times;</button>' +
        '<button type="button" data-act="prev" style="left:1rem;top:50%" aria-label="Ảnh trước">&#8249;</button>' +
        '<button type="button" data-act="next" style="right:1rem;top:50%" aria-label="Ảnh sau">&#8250;</button>' +
        '<figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(box);
    var image = box.querySelector('img');
    var caption = box.querySelector('figcaption');
    var index = 0;
    function show(i) {
        index = (i + links.length) % links.length;
        var a = links[index];
        image.src = a.getAttribute('href');
        image.alt = a.querySelector('img') ? a.querySelector('img').alt : '';
        caption.textContent = a.getAttribute('data-caption') || image.alt;
        box.classList.add('open');
    }
    function close() { box.classList.remove('open'); }
    links.forEach(function (a, i) {
        a.addEventListener('click', function (e) { e.preventDefault(); show(i); });
    });
    box.addEventListener('click', function (e) {
        var act = e.target.getAttribute('data-act');
        if (act === 'close' || e.target === box) close();
        if (act === 'prev') show(index - 1);
        if (act === 'next') show(index + 1);
    });
    document.addEventListener('keydown', function (e) {
        if (!box.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
    });
})();
