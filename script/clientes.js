// script/clientes.js

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
    } else {
      vistaListado.style.display = 'block';
      vistaFormulario.style.display = 'none';
      tabListado.classList.add('active');
      tabCrear.classList.remove('active');
      cargarClientes();
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

  // Cargar tabla de clientes
  async function cargarClientes() {
    const tbody = document.getElementById('tablaClientesBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">Cargando...</td></tr>';

    try {
      const clientes = await apiRequest('/clientes');
      document.getElementById('contadorClientes').textContent = `Total: ${clientes.length}`;

      if (!clientes || clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">No hay clientes registrados aún.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      clientes.forEach((c) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${c.nombre}</strong></td>
          <td>${c.alias || '-'}</td>
          <td><span class="badge-rfc">${c.rfc}</span></td>
          <td>${c.cp || '-'}</td>
          <td>${c.regimen || '-'}</td>
          <td>
            <button class="btn-ver-facturas" onclick="verDetalleCliente(${c.id})">
              <i class="fa fa-eye"></i> Historial
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error: ${err.message}</td></tr>`;
    }
  }

  // Guardar nuevo cliente
  document.getElementById('clienteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      nombre: document.getElementById('cliNombre').value.trim(),
      alias: document.getElementById('cliAlias').value.trim() || null,
      rfc: document.getElementById('cliRfc').value.trim().toUpperCase(),
      cp: document.getElementById('cliCp').value.trim() || null,
      regimen: document.getElementById('cliRegimen').value.trim() || null,
    };

    try {
      await apiRequest('/clientes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Cliente registrado con éxito');
      document.getElementById('clienteForm').reset();
      mostrarVista('list');
    } catch (err) {
      alert(err.message || 'Error al guardar el cliente');
    }
  });

  // Modal para ver facturas asociadas al cliente
  window.verDetalleCliente = async (clienteId) => {
    const modal = document.getElementById('modalClienteDetalle');
    const contenedor = document.getElementById('modalFacturasListado');
    modal.style.display = 'flex';
    contenedor.innerHTML = '<p style="color: #64748b;">Cargando facturas...</p>';

    try {
      const cliente = await apiRequest(`/clientes/${clienteId}`);
      document.getElementById('modalNombreCliente').textContent = `${cliente.nombre} (${cliente.rfc})`;

      if (!cliente.facturas || cliente.facturas.length === 0) {
        contenedor.innerHTML = '<p style="color: #64748b;">Este cliente no tiene facturas emitidas todavía.</p>';
        return;
      }

      let html = '<ul style="list-style: none; padding: 0;">';
      cliente.facturas.forEach((fac) => {
        const fecha = new Date(fac.createdAt).toLocaleDateString('es-MX');
        html += `
          <li style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between;">
            <span>Folio: <strong>${fac.id.substring(0, 8)}...</strong> (${fecha})</span>
            <span style="color: #15a521; font-weight: 600;">$${Number(fac.total).toFixed(2)} MXN</span>
          </li>
        `;
      });
      html += '</ul>';
      contenedor.innerHTML = html;
    } catch (e) {
      contenedor.innerHTML = `<p style="color: red;">Error al consultar detalle: ${e.message}</p>`;
    }
  };

  window.cerrarModalDetalle = () => {
    document.getElementById('modalClienteDetalle').style.display = 'none';
  };
});