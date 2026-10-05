const menuBtn = document.getElementById("menu-btn");
const dropdownMenu = document.getElementById("dropdown-menu");

// Alternar despliegue del menú
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const isExpanded = dropdownMenu.classList.toggle("active");
  menuBtn.setAttribute("aria-expanded", isExpanded);
});

// Cerrar al hacer clic fuera del menú
document.addEventListener("click", (e) => {
  if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) {
    dropdownMenu.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

// Cerrar con la tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    dropdownMenu.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});