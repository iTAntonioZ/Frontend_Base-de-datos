// script/facturas.js

let todasLasFacturas = [];

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
      cargarFacturas();
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

  // ==========================================
  // RECURSIVIDAD 1: Suma de conceptos
  // ==========================================
  function sumarConceptosRecursivo(conceptosArray, index = 0) {
    if (index >= conceptosArray.length) {
      return 0;
    }
    return conceptosArray[index].importe + sumarConceptosRecursivo(conceptosArray, index + 1);
  }

  // ==========================================
  // RECURSIVIDAD 2: Renderizado de la lista
  // ==========================================
  function renderizarFacturasRecursivo(facturas, index, contenedor) {
    if (index >= facturas.length) {
      return;
    }

    const fac = facturas[index];
    const item = document.createElement('div');
    item.className = 'factura-item';

    const fecha = new Date(fac.createdAt).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let listaConceptosHtml = '';
    if (Array.isArray(fac.conceptos)) {
      listaConceptosHtml = fac.conceptos
        .map((c) => `<li>${c.cantidad}x ${c.descripcion} ($${Number(c.valorUnitario).toFixed(2)}) = $${Number(c.importe).toFixed(2)}</li>`)
        .join('');
    }

    item.innerHTML = `
      <div class="factura-item-header">
        <span><i class="fa fa-file-invoice"></i> Folio: ${fac.id.substring(0, 8)} - ${fac.receptorNombre} (${fac.receptorRfc})</span>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span style="color: #15a521; font-size: 1.1rem;">$${Number(fac.total).toFixed(2)} MXN</span>
          <button class="btn-pdf" onclick="descargarFacturaPDF('${fac.id}')">
            <i class="fa fa-file-pdf"></i> Descargar PDF
          </button>
        </div>
      </div>
      <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 6px;">
        Emisor: ${fac.emisorNombre} | Fecha: ${fecha} | Uso CFDI: ${fac.usoCfdi}
      </div>
      <ul class="sub-conceptos">
        ${listaConceptosHtml}
      </ul>
    `;

    contenedor.appendChild(item);
    renderizarFacturasRecursivo(facturas, index + 1, contenedor);
  }

  async function cargarFacturas() {
    const contenedor = document.getElementById('contenedorFacturas');
    contenedor.innerHTML = '<p style="color: #64748b;">Cargando...</p>';

    try {
      todasLasFacturas = await apiRequest('/facturas');
      contenedor.innerHTML = '';

      if (!todasLasFacturas || todasLasFacturas.length === 0) {
        contenedor.innerHTML = '<p style="color: #64748b;">No hay facturas registradas todavía.</p>';
        document.getElementById('resumenRecursivo').textContent = '';
        return;
      }

      renderizarFacturasRecursivo(todasLasFacturas, 0, contenedor);

      const totalGlobal = todasLasFacturas.reduce((acc, f) => {
        return acc + (f.conceptos ? sumarConceptosRecursivo(f.conceptos, 0) : f.total);
      }, 0);

      document.getElementById('resumenRecursivo').textContent = 
        `Total facturado acumulado: $${totalGlobal.toFixed(2)} MXN`;
    } catch (e) {
      contenedor.innerHTML = `<p style="color: red;">Error al cargar historial: ${e.message}</p>`;
    }
  }

  // ==========================================
  // GENERACIÓN DE PDF CFDI 4.0
  // ==========================================
  window.descargarFacturaPDF = (facturaId) => {
    const fac = todasLasFacturas.find((f) => f.id === facturaId);
    if (!fac) {
      alert('Factura no encontrada para generar PDF');
      return;
    }

    const tpl = document.getElementById('pdfTemplate');
    const filasConceptos = (fac.conceptos || [])
      .map(
        (c) => `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${c.cantidad}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${c.unidadMedida}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${c.descripcion}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">$${Number(c.valorUnitario).toFixed(2)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">$${Number(c.importe).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    tpl.innerHTML = `
      <div style="border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between;">
        <div>
          <h2 style="margin: 0; color: #1e293b;">COMPROBANTE FISCAL DIGITAL (CFDI 4.0)</h2>
          <p style="margin: 4px 0; color: #64748b;">Folio Fiscal: ${fac.id}</p>
          <p style="margin: 4px 0; color: #64748b;">Fecha de Emisión: ${new Date(fac.createdAt).toLocaleString('es-MX')}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0; color: #2563eb;">ORIGINAL</h3>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px;">
          <h4 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">EMISOR</h4>
          <p style="margin: 4px 0;"><strong>Razón Social:</strong> ${fac.emisorNombre}</p>
          <p style="margin: 4px 0;"><strong>RFC:</strong> ${fac.emisorRfc}</p>
          <p style="margin: 4px 0;"><strong>Régimen:</strong> ${fac.emisorRegimen}</p>
          <p style="margin: 4px 0;"><strong>C.P.:</strong> ${fac.emisorCp}</p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px;">
          <h4 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">RECEPTOR</h4>
          <p style="margin: 4px 0;"><strong>Nombre:</strong> ${fac.receptorNombre}</p>
          <p style="margin: 4px 0;"><strong>RFC:</strong> ${fac.receptorRfc}</p>
          <p style="margin: 4px 0;"><strong>C.P.:</strong> ${fac.receptorCp}</p>
          <p style="margin: 4px 0;"><strong>Régimen:</strong> ${fac.receptorRegimen}</p>
          <p style="margin: 4px 0;"><strong>Uso CFDI:</strong> ${fac.usoCfdi}</p>
        </div>
      </div>

      <h4 style="margin-bottom: 8px; color: #1e293b;">CONCEPTOS</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Cant.</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Unidad</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Descripción</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">P. Unitario</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px;">Importe</th>
          </tr>
        </thead>
        <tbody>
          ${filasConceptos}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 10px;">
        <h2 style="margin: 0; color: #1e293b;">Total: $${Number(fac.total).toFixed(2)} MXN</h2>
      </div>

      <div style="margin-top: 30px; font-size: 0.75rem; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
        Este documento es una representación impresa de un CFDI versión 4.0 emitida por el ERP.
      </div>
    `;

    tpl.style.display = 'block';

    const opt = {
      margin: 10,
      filename: `Factura_${fac.receptorRfc}_${fac.id.substring(0, 6)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf()
      .set(opt)
      .from(tpl)
      .save()
      .then(() => {
        tpl.style.display = 'none';
      });
  };

  // ==========================================
  // CLIENTES Y FORMULARIO
  // ==========================================
  let clientesLista = [];
  let conceptos = [];

  async function cargarClientes() {
    try {
      clientesLista = await apiRequest('/clientes');
      const select = document.getElementById('selectCliente');
      clientesLista.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.nombre} (${c.rfc}) ${c.alias ? '- ' + c.alias : ''}`;
        select.appendChild(opt);
      });
    } catch (e) {
      console.error('Error al cargar clientes:', e);
    }
  }

  document.getElementById('selectCliente').addEventListener('change', (e) => {
    const id = e.target.value;
    const cliente = clientesLista.find((c) => c.id.toString() === id.toString());
    if (cliente) {
      document.getElementById('recRfc').value = cliente.rfc || '';
      document.getElementById('recNombre').value = cliente.nombre || '';
      document.getElementById('recCp').value = cliente.cp || '';
      document.getElementById('recRegimen').value = cliente.regimen || '';
    }
  });

  document.getElementById('btnAddConcepto').addEventListener('click', () => {
    const cantidad = parseFloat(document.getElementById('conCantidad').value) || 1;
    const descripcion = document.getElementById('conDesc').value.trim();
    const unidadMedida = document.getElementById('conUnidad').value.trim() || 'E48';
    const valorUnitario = parseFloat(document.getElementById('conPrecio').value) || 0;

    if (!descripcion || valorUnitario <= 0) {
      alert('Ingresa una descripción válida y un precio unitario mayor a 0');
      return;
    }

    const importe = cantidad * valorUnitario;
    conceptos.push({ cantidad, unidadMedida, descripcion, valorUnitario, importe });

    actualizarTablaConceptos();

    document.getElementById('conDesc').value = '';
    document.getElementById('conPrecio').value = '';
    document.getElementById('conCantidad').value = '1';
  });

  function actualizarTablaConceptos() {
    const tbody = document.querySelector('#tablaConceptos tbody');
    tbody.innerHTML = '';

    conceptos.forEach((c, idx) => {
      tbody.innerHTML += `
        <tr>
          <td>${c.cantidad}</td>
          <td>${c.unidadMedida}</td>
          <td>${c.descripcion}</td>
          <td>$${c.valorUnitario.toFixed(2)}</td>
          <td>$${c.importe.toFixed(2)}</td>
          <td><button type="button" onclick="eliminarConcepto(${idx})" style="color:red;border:none;background:none;cursor:pointer;"><i class="fa fa-trash"></i></button></td>
        </tr>
      `;
    });

    const total = sumarConceptosRecursivo(conceptos, 0);
    document.getElementById('lblTotalFactura').textContent = total.toFixed(2);
  }

  window.eliminarConcepto = (idx) => {
    conceptos.splice(idx, 1);
    actualizarTablaConceptos();
  };

  document.getElementById('facturaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (conceptos.length === 0) {
      alert('Debes agregar al menos un concepto a la factura');
      return;
    }

    const total = sumarConceptosRecursivo(conceptos, 0);
    const clienteSelectVal = document.getElementById('selectCliente').value;

    const payload = {
      emisor: {
        rfc: document.getElementById('emisorRfc').value.trim() || 'AAA010101AAA',
        nombre: document.getElementById('emisorNombre').value.trim() || 'Mi Empresa S.A. de C.V.',
        regimen: document.getElementById('emisorRegimen').value.trim() || '601 - General de Ley Personas Morales',
        cp: document.getElementById('emisorCp').value.trim() || '97000',
      },
      receptor: {
        clienteId: clienteSelectVal ? parseInt(clienteSelectVal, 10) : null,
        rfc: document.getElementById('recRfc').value.trim().toUpperCase(),
        nombre: document.getElementById('recNombre').value.trim(),
        cp: document.getElementById('recCp').value.trim(),
        regimen: document.getElementById('recRegimen').value.trim(),
        usoCfdi: document.getElementById('recUso').value,
      },
      conceptos,
      total,
    };

    try {
      const facturaCreada = await apiRequest('/facturas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Factura emitida con éxito. Descargando comprobante en PDF...');

      // Agregar a la lista en memoria y descargar PDF de inmediato
      todasLasFacturas.unshift(facturaCreada);
      descargarFacturaPDF(facturaCreada.id);

      // Limpiar formulario y cambiar al listado
      conceptos = [];
      actualizarTablaConceptos();
      document.getElementById('facturaForm').reset();
      mostrarVista('list');
    } catch (err) {
      alert(err.message || 'Error al guardar la factura');
    }
  });

  cargarClientes();
});