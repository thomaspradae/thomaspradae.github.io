gsap.registerPlugin(ScrollTrigger);

        gsap.to(".stickysidebar", {
            scrollTrigger: {
                trigger: ".footer-line",
                start: "top 100%",
                end: "bottom 10%",
                scrub: 1,
                // markers: true
            },
            y: -500,
            // duration: 100,
        });

