document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".page-content table").forEach((table) => {
    if (table.closest(".table-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
});
