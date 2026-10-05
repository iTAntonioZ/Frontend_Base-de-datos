// script/tickets.js

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();

  const tabListado = document.getElementById('tabListado');
  const tabCrear = document.getElementById('tabCrear');
  const vistaListado = document.getElementById('vistaListado');
  const vistaFormulario = document.getElementById('vistaFormulario');

  function mostrarVista(vista) {
    if (vista === 'form') {
      vistaListado.style.display = 'none';
      vistaFormulario.style.display = 'block';
      tabCrear.classList.add('active');
      tabListado.classList.remove('active');
      cargarSelectClientes();
    } else {
      vistaListado.style.display = 'block';
      vistaFormulario.style.display = 'none';
      tabListado.classList.add('active');
      tabCrear.classList.remove('active');
      cargarTickets();
    }
  }

  tabListado.addEventListener('click', () => mostrarVista('list'));
  tabCrear.addEventListener('click', () => mostrarVista('form'));

  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'form') {
    mostrarVista('form');
  } else {
    mostrarVista('list');
  }

  // Cargar selector de clientes para el formulario
  async function cargarSelectClientes() {
    const select = document.getElementById('ticketCliente');
    try {
      const clientes = await apiRequest('/clientes');
      select.innerHTML = '<option value="">-- Selecciona un Cliente --</option>';
      clientes.forEach((c) => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.nombre} (${c.rfc})`;
        select.appendChild(option);
      });
    } catch (e) {
      select.innerHTML = '<option value="">Error al cargar clientes</option>';
    }
  }

  // Cargar tabla de tickets
  async function cargarTickets() {
    const tbody = document.getElementById('tablaTicketsBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b;">Cargando...</td></tr>';

    try {
      const tickets = await apiRequest('/tickets');
      document.getElementById('contadorTickets').textContent = `Total: ${tickets.length}`;

      if (!tickets || tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b;">No hay tickets registrados.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      tickets.forEach((t) => {
        const tr = document.createElement('tr');
        const fecha = new Date(t.createdAt).toLocaleDateString('es-MX');
        
        let badgePrioridad = 'badge-baja';
        if (t.prioridad === 'ALTA') badgePrioridad = 'badge-alta';
        if (t.prioridad === 'MEDIA') badgePrioridad = 'badge-media';

        tr.innerHTML = `
          <td><strong>#${t.id.toString().substring(0, 6)}</strong></td>
          <td>${t.cliente ? t.cliente.nombre : 'Sin Cliente'}</td>
          <td>${t.asunto}</td>
          <td><span class="badge ${badgePrioridad}">${t.prioridad}</span></td>
          <td>
            <select class="select-estado" onchange="actualizarEstadoTicket('${t.id}', this.value)">
              <option value="PENDIENTE" ${t.estado === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
              <option value="EN_PROCESO" ${t.estado === 'EN_PROCESO' ? 'selected' : ''}>EN PROCESO</option>
              <option value="RESUELTO" ${t.estado === 'RESUELTO' ? 'selected' : ''}>RESUELTO</option>
            </select>
          </td>
          <td>${fecha}</td>
          <td>
            <button onclick="alert('Descripción: ${t.descripcion || 'Sin detalles'}')" style="background:none; border:none; color:#2563eb; cursor:pointer;">
              <i class="fa fa-info-circle"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error: ${err.message}</td></tr>`;
    }
  }

  // Cambiar estado de un ticket directamente desde la tabla
  window.actualizarEstadoTicket = async (ticketId, nuevoEstado) => {
    try {
      await apiRequest(`/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      alert('Estado del ticket actualizado');
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message);
      cargarTickets();
    }
  };

  // Crear nuevo ticket
  document.getElementById('ticketForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      clienteId: document.getElementById('ticketCliente').value,
      asunto: document.getElementById('ticketAsunto').value.trim(),
      prioridad: document.getElementById('ticketPrioridad').value,
      estado: document.getElementById('ticketEstado').value,
      descripcion: document.getElementById('ticketDescripcion').value.trim() || null,
    };

    try {
      await apiRequest('/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Ticket registrado correctamente');
      document.getElementById('ticketForm').reset();
      mostrarVista('list');
    } catch (err) {
      alert(err.message || 'Error al guardar el ticket');
    }
  });
});