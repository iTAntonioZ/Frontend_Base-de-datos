document.addEventListener("DOMContentLoaded", function() {
    
    // Obtenemos el contexto del canvas con el nuevo ID
    const ctx = document.getElementById('facturacionChart').getContext('2d');

    // Gradiente azul para la gráfica
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(52, 114, 247, 0.6)'); 
    gradient.addColorStop(1, 'rgba(52, 114, 247, 0.1)'); 

    const facturacionChart = new Chart(ctx, {
        type: 'line', 
        data: {
            // Meses recortados para mostarar en español
            labels: ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
            datasets: [{
                label: 'Facturación (MXN)',
                // Datos de facturación simulados
                data: [320000, 350000, 310000, 390500, 410000, 450000],
                backgroundColor: gradient, 
                borderColor: '#3472f7', 
                borderWidth: 2,
                fill: true, 
                tension: 0.3, 
                pointRadius: 0 
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false // Oculta la leyenda superior
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        // Formatos para que muestre "K" de miles (Ej: 300K)
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false 
                    }
                }
            }
        }
    });

//Logica de acciones rápidas
// --- 1. MÁQUINAS PARA ABRIR Y CERRAR ---
// ==========================================
// CONTROLADOR DE PANELES LATERALES
// ==========================================

// 1. Máquina para barrer y ocultar todo
function cerrarTodosLosModales() {
    const listaDeModales = ['modalFactura', 'modalCliente', 'modalDivisa', 'modalTicket'];
    
    listaDeModales.forEach(function(id) {
        const ventana = document.getElementById(id);
        if (ventana) {
            ventana.classList.remove('modal-visible');
            ventana.classList.add('modal-oculto');
        }
    });
}

// 2. Guardia de seguridad (La función inteligente para abrir)
function abrirModal(idModal) {
    // A. Buscamos si hay un formulario abierto en este momento
    const modalAbierto = document.querySelector('.modal-visible');

    // B. Inspeccionamos si tiene datos escritos
    if (modalAbierto) {
        const cajasDeTexto = modalAbierto.querySelectorAll('input');
        let tieneDatos = false;

        cajasDeTexto.forEach(function(caja) {
            if (caja.value.trim() !== '') {
                tieneDatos = true;
            }
        });

        // C. Si hay datos, bloqueamos la acción
        if (tieneDatos) {
            alert("⚠️ Tienes información sin guardar. Termina el registro o borra los datos antes de cambiar de sección.");
            return; 
        }
    }

    
    cerrarTodosLosModales();
    
    const modalSolicitado = document.getElementById(idModal);
    if (modalSolicitado) {
        modalSolicitado.classList.remove('modal-oculto');
        modalSolicitado.classList.add('modal-visible');
    }
}

// 3. Máquina para cerrar usando la tachita (Y limpiar la caja)
function cerrarModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) {
        // Buscamos el formulario de adentro y lo reseteamos (lo dejamos en blanco)
        const formulario = modal.querySelector('form');
        if (formulario) {
            formulario.reset();
        }
        
        modal.classList.remove('modal-visible');
        modal.classList.add('modal-oculto');
    }
}

//Conección botones html

// Tarjetas (Para Abrir)
document.getElementById('btnNuevaFactura').addEventListener('click', function() { abrirModal('modalFactura'); });
document.getElementById('btnNuevoCliente').addEventListener('click', function() { abrirModal('modalCliente'); });
document.getElementById('btnActDivisa').addEventListener('click', function() { abrirModal('modalDivisa'); });
document.getElementById('btnNuevoTicket').addEventListener('click', function() { abrirModal('modalTicket'); });

// Tachitas 'X' (Para Cerrar)
document.getElementById('btnCerrarFactura').addEventListener('click', function() { cerrarModal('modalFactura'); });
document.getElementById('btnCerrarCliente').addEventListener('click', function() { cerrarModal('modalCliente'); });
document.getElementById('btnCerrarDivisa').addEventListener('click', function() { cerrarModal('modalDivisa'); });
document.getElementById('btnCerrarTicket').addEventListener('click', function() { cerrarModal('modalTicket'); });
 
});
