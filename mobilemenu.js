function toggleMenu() {
    var menuOverlay = document.getElementById("menu-overlay");
    var menuButton = document.getElementById("menu-button");
    
    if (!menuOverlay.style.left || menuOverlay.style.left === "-100%") {
        menuOverlay.style.left = "0";
        menuButton.textContent = "[ X ]";
    } else {
        menuOverlay.style.left = "-100%";
        menuButton.textContent = "[ MENU ]";
    }
}