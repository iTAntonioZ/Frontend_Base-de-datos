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
function abrirModal(idModal) {
    document.getElementById(idModal).classList.remove('modal-oculto');
    document.getElementById(idModal).classList.add('modal-visible');
}

function cerrarModal(idModal) {
    document.getElementById(idModal).classList.remove('modal-visible');
    document.getElementById(idModal).classList.add('modal-oculto');
}

// --- 2. CONECTAR TARJETAS (ABRIR) ---
document.getElementById('btnNuevaFactura').addEventListener('click', function() { abrirModal('modalFactura'); });
document.getElementById('btnNuevoCliente').addEventListener('click', function() { abrirModal('modalCliente'); });
document.getElementById('btnActDivisa').addEventListener('click', function() { abrirModal('modalDivisa'); }); // ¡Corregido!
document.getElementById('btnNuevoTicket').addEventListener('click', function() { abrirModal('modalTicket'); });

// --- 3. CONECTAR TACHITAS 'X' (CERRAR) ---
document.getElementById('btnCerrarFactura').addEventListener('click', function() { cerrarModal('modalFactura'); });
document.getElementById('btnCerrarCliente').addEventListener('click', function() { cerrarModal('modalCliente'); });
document.getElementById('btnCerrarDivisa').addEventListener('click', function() { cerrarModal('modalDivisa'); });
document.getElementById('btnCerrarTicket').addEventListener('click', function() { cerrarModal('modalTicket'); });


});