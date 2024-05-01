gsap.registerPlugin(ScrollTrigger);
    
if (window.innerWidth > 600) {
  console.log("Screen width is greater than 600px, animation active");
  gsap.to(".stickysidebar", {
    scrollTrigger: {
      trigger: ".footer-line",
      start: "top 100%",
      end: "bottom 10%",
      scrub: 1,
    },
    y: -500,
  });
} else {
  console.log("Screen width is less than 600px, animation inactive");
}