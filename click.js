document.addEventListener("DOMContentLoaded", function() {
    const currentPage = window.location.pathname.split('/').pop();

    // Correct the querySelector to match your hrefs accurately
    const menuLinks = document.querySelectorAll('.stickysidebar a');

    menuLinks.forEach(link => {
        if (link.getAttribute('href').includes(currentPage)) {
            link.classList.add('active');
        }
    });
});