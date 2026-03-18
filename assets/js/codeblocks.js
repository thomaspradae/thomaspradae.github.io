document.addEventListener("DOMContentLoaded", () => {
    const wrappers = document.querySelectorAll(".highlighter-rouge");
  
    wrappers.forEach((wrapper) => {
      const highlightBox = wrapper.querySelector(".highlight");
      const code = wrapper.querySelector("code");
  
      if (!highlightBox || !code) return;
  
      const classList = Array.from(wrapper.classList);
      const languageClass = classList.find((cls) => cls.startsWith("language-"));
      const language = languageClass ? languageClass.replace("language-", "") : "text";
  
      highlightBox.setAttribute("data-lang", language);
  
      if (!highlightBox.querySelector(".code-copy-button")) {
        const button = document.createElement("button");
        button.className = "code-copy-button";
        button.type = "button";
        button.setAttribute("aria-label", "Copy code");
        button.textContent = "Copy";
  
        button.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(code.innerText);
            button.textContent = "Copied";
            setTimeout(() => {
              button.textContent = "Copy";
            }, 1400);
          } catch {
            button.textContent = "Failed";
            setTimeout(() => {
              button.textContent = "Copy";
            }, 1400);
          }
        });
  
        highlightBox.appendChild(button);
      }
    });
  });