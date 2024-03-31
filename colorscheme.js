document.addEventListener('DOMContentLoaded', function() {
    // Define your theme-dependent images here
    const lightThemeImages = {
        "gifHome": "FINAL_V4.gif",
        "icon1": "emptyblackball.svg",
        "icon2": "poslogo.svg"
    };

    const darkThemeImages = {
        "gifHome": "FINAL_V1_DARK.gif",
        "icon1": "emptyblackball_dark.svg",
        "icon2": "poslogo_dark.svg"
    };

    const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.textContent = `${savedTheme === 'dark' ? 'Light' : 'Dark'} Mode`;

    const gifHome = document.querySelector('.gif-home');
    const icon1 = document.querySelector('.info-icon:first-of-type');
    const icon2 = document.querySelector('.footer-image');

    // Function to update images based on the current theme
    function updateImagesForTheme(theme) {
        if (theme === 'dark') {
            gifHome.src = darkThemeImages.gifHome;
            icon1.src = darkThemeImages.icon1;
            icon2.src = darkThemeImages.icon2;
        } else {
            gifHome.src = lightThemeImages.gifHome;
            icon1.src = lightThemeImages.icon1;
            icon2.src = lightThemeImages.icon2;
        }
    }

    // Update images upon initial load
    updateImagesForTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme); 
        themeToggle.textContent = `${newTheme === 'dark' ? 'Light' : 'Dark'} Mode`;

        // Update images upon theme change
        updateImagesForTheme(newTheme);
    });
});

