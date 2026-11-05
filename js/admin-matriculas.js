const DB_Estudiantes = {
  categorias: JSON.parse(localStorage.getItem('cae_categorias')) || {},
  estudiantes: JSON.parse(localStorage.getItem('cae_estudiantes')) || [],
  guardar: function() {
    localStorage.setItem('cae_estudiantes', JSON.stringify(this.estudiantes));
    localStorage.setItem('cae_categorias', JSON.stringify(this.categorias));
  }
};

const ModuloEstudiantes = {
  inicializar: function() {
    this.poblarFiltroCategorias();
    this.actualizarEstadosMora();
    this.renderizarTabla();
    this.asignarEventos();
  },

  poblarFiltroCategorias: function() {
    const selectorC = document.getElementById('filtroCategoria');
    const selectEdit = document.getElementById('editCategoriaSelect');
    Object.keys(DB_Estudiantes.categorias).forEach(key => {
      selectorC.appendChild(new Option(DB_Estudiantes.categorias[key].titulo, key));
      selectEdit.appendChild(new Option(DB_Estudiantes.categorias[key].titulo, key));
    });
  },

  actualizarEstadosMora: function() {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    let moraCount = 0;

    DB_Estudiantes.estudiantes.forEach(est => {
      const fechaVenc = new Date(est.proximoPago + "T00:00:00");
      const fechaLimite = new Date(fechaVenc);
      fechaLimite.setDate(fechaLimite.getDate() + 5); // 5 días de gracia

      if (hoy > fechaLimite) {
        est.estado = 'mora'; moraCount++;
      } else if (hoy > fechaVenc && hoy <= fechaLimite) {
        est.estado = 'gracia';
      } else {
        est.estado = 'aldia';
      }
    });
    DB_Estudiantes.guardar();
    document.getElementById('contadorMoraTop').textContent = moraCount;
  },

  renderizarTabla: function() {
    const tbody = document.getElementById('tablaEstudiantes');
    const fTexto = document.getElementById('filtroBuscar').value.toLowerCase();
    const fCat = document.getElementById('filtroCategoria').value;
    const fEstado = document.getElementById('filtroEstado').value;

    tbody.innerHTML = '';
    let filtrados = 0;

    DB_Estudiantes.estudiantes.forEach(est => {
      const coTexto = est.nombres.toLowerCase().includes(fTexto) || est.apellidos.toLowerCase().includes(fTexto) || est.documento.includes(fTexto);
      const coCat = fCat === 'todas' || est.categoriaId === fCat;
      const coEst = fEstado === 'todos' || est.estado === fEstado;

      if (coTexto && coCat && coEst) {
        filtrados++;
        const catName = DB_Estudiantes.categorias[est.categoriaId] ? DB_Estudiantes.categorias[est.categoriaId].titulo : 'Sin categoría';
        
        let badgeEstado = '';
        if(est.estado === 'mora') badgeEstado = '<span class="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold uppercase text-[10px]">En Mora</span>';
        else if(est.estado === 'gracia') badgeEstado = '<span class="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold uppercase text-[10px]">Per. Gracia</span>';
        else badgeEstado = '<span class="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold uppercase text-[10px]">Al Día</span>';

        tbody.innerHTML += `
          <tr class="hover:bg-gray-50 transition-colors group cursor-pointer border-b border-gray-200" onclick="ModuloEstudiantes.abrirModalEdicion('${est.documento}')">
            <td class="p-3 font-semibold text-gray-700">${est.documento}</td>
            <td class="p-3 font-bold text-gray-900">${est.nombres} ${est.apellidos}</td>
            <td class="p-3 text-gray-600 truncate max-w-[150px]">${catName}</td>
            <td class="p-3 text-gray-600">${est.fechaMatricula}</td>
            <td class="p-3 font-bold ${est.estado === 'mora' ? 'text-red-600' : 'text-gray-700'}">${est.proximoPago}</td>
            <td class="p-3 text-center">${badgeEstado}</td>
            <td class="p-3 text-center"><button class="text-blue-600 font-bold hover:underline text-[11px]">Gestionar</button></td>
          </tr>
        `;
      }
    });

    if (filtrados === 0) tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-gray-500 italic">No se encontraron estudiantes.</td></tr>';
    document.getElementById('totalEstudiantesBadge').textContent = `Total: ${filtrados}`;
  },

  abrirModalEdicion: function(docId) {
    const estudiante = DB_Estudiantes.estudiantes.find(e => e.documento === docId);
    if (!estudiante) return;

    document.getElementById('editEstudianteId').value = estudiante.documento;
    document.getElementById('modalDocEstudiante').textContent = `Documento: ${estudiante.documento}`;
    document.getElementById('editNombres').value = estudiante.nombres;
    document.getElementById('editApellidos').value = estudiante.apellidos;
    document.getElementById('editCategoriaSelect').value = estudiante.categoriaId;
    document.getElementById('infoFechaMatricula').textContent = estudiante.fechaMatricula;
    document.getElementById('editFechaProximoPago').value = estudiante.proximoPago;

    const badge = document.getElementById('estadoPagoBadge');
    if (estudiante.estado === 'mora') {
      badge.className = "text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200"; badge.textContent = "EN MORA";
    } else if (estudiante.estado === 'gracia') {
      badge.className = "text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-200"; badge.textContent = "EN GRACIA (5 DÍAS)";
    } else {
      badge.className = "text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200"; badge.textContent = "AL DÍA";
    }

    // Dibujar historial
    const listaHistorial = document.getElementById('listaHistorialPagos');
    listaHistorial.innerHTML = '';
    if(!estudiante.historialPagos || estudiante.historialPagos.length === 0) {
      listaHistorial.innerHTML = '<div class="text-xs text-gray-400 italic py-2">No hay pagos registrados.</div>';
    } else {
      // Revertimos para ver el más reciente primero
      [...estudiante.historialPagos].reverse().forEach((pago, index) => {
        listaHistorial.innerHTML += `
          <div class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 text-[11px]">
            <span class="font-semibold text-gray-700">Pago #${estudiante.historialPagos.length - index}</span>
            <span class="text-gray-500">${pago.fecha}</span>
            <span class="font-bold text-green-700">${pago.monto}</span>
          </div>`;
      });
    }

    document.getElementById('inputMontoPago').value = '';
    const modal = document.getElementById('modalEdicionEstudiante');
    modal.classList.remove('hidden'); modal.classList.add('flex');
  },

  cerrarModal: function() {
    const modal = document.getElementById('modalEdicionEstudiante');
    modal.classList.add('hidden'); modal.classList.remove('flex');
  },

  registrarPago: function() {
    const docId = document.getElementById('editEstudianteId').value;
    const estudiante = DB_Estudiantes.estudiantes.find(e => e.documento === docId);
    const montoRaw = document.getElementById('inputMontoPago').value.replace(/\D/g, '');
    
    if (!montoRaw) return alert('Ingrese un monto válido.');
    const montoFormateado = `$${new Intl.NumberFormat('es-CO').format(montoRaw)}`;
    
    // Obtiene el día exacto en que se realiza el pago (Hoy)
    const hoy = new Date();
    const fechaPago = hoy.toISOString().split('T')[0];

    // Adelantar próximo pago 30 días desde HOY
    const fechaNueva = new Date(hoy);
    fechaNueva.setDate(fechaNueva.getDate() + 30);
    const nuevaFechaVenc = fechaNueva.toISOString().split('T')[0];

    // Guardar en historial
    if(!estudiante.historialPagos) estudiante.historialPagos = [];
    estudiante.historialPagos.push({ fecha: fechaPago, monto: montoFormateado });
    
    estudiante.proximoPago = nuevaFechaVenc;
    DB_Estudiantes.guardar();
    
    this.actualizarEstadosMora();
    this.renderizarTabla();
    this.abrirModalEdicion(docId); // Recargar modal para ver cambios
    alert(`Pago de ${montoFormateado} registrado exitosamente. Próximo vencimiento será el: ${nuevaFechaVenc}.`);
  },

  guardarEdicion: function(e) {
    e.preventDefault();
    const docId = document.getElementById('editEstudianteId').value;
    const estudiante = DB_Estudiantes.estudiantes.find(e => e.documento === docId);
    const catAnterior = estudiante.categoriaId;
    const catNueva = document.getElementById('editCategoriaSelect').value;

    estudiante.nombres = document.getElementById('editNombres').value.trim();
    estudiante.apellidos = document.getElementById('editApellidos').value.trim();
    estudiante.categoriaId = catNueva;
    estudiante.proximoPago = document.getElementById('editFechaProximoPago').value;

    if (catAnterior !== catNueva) {
      if(DB_Estudiantes.categorias[catAnterior] && !DB_Estudiantes.categorias[catAnterior].esPorHoras) {
        DB_Estudiantes.categorias[catAnterior].cuposOcupados = Math.max(0, DB_Estudiantes.categorias[catAnterior].cuposOcupados - 1);
      }
      if(DB_Estudiantes.categorias[catNueva] && !DB_Estudiantes.categorias[catNueva].esPorHoras) {
        DB_Estudiantes.categorias[catNueva].cuposOcupados += 1;
      }
    }
    DB_Estudiantes.guardar();
    this.actualizarEstadosMora(); this.renderizarTabla(); this.cerrarModal();
    alert('Datos actualizados correctamente.');
  },

  eliminarEstudiante: function() {
    const docId = document.getElementById('editEstudianteId').value;
    if (!confirm(`¿Está seguro de eliminar al estudiante con documento ${docId}? Esta acción borrará su historial completo.`)) return;

    const index = DB_Estudiantes.estudiantes.findIndex(e => e.documento === docId);
    const estudiante = DB_Estudiantes.estudiantes[index];

    if (DB_Estudiantes.categorias[estudiante.categoriaId] && !DB_Estudiantes.categorias[estudiante.categoriaId].esPorHoras) {
      DB_Estudiantes.categorias[estudiante.categoriaId].cuposOcupados = Math.max(0, DB_Estudiantes.categorias[estudiante.categoriaId].cuposOcupados - 1);
    }
    DB_Estudiantes.estudiantes.splice(index, 1);
    DB_Estudiantes.guardar();
    this.actualizarEstadosMora(); this.renderizarTabla(); this.cerrarModal();
  },

  asignarEventos: function() {
    document.getElementById('filtroBuscar').addEventListener('input', () => this.renderizarTabla());
    document.getElementById('filtroCategoria').addEventListener('change', () => this.renderizarTabla());
    document.getElementById('filtroEstado').addEventListener('change', () => this.renderizarTabla());
    document.getElementById('btnCloseEditModal').addEventListener('click', () => this.cerrarModal());
    document.getElementById('btnCancelEdit').addEventListener('click', () => this.cerrarModal());
    document.getElementById('formEditarEstudiante').addEventListener('submit', (e) => this.guardarEdicion(e));
    document.getElementById('btnRegistrarPago').addEventListener('click', () => this.registrarPago());
    document.getElementById('btnEliminarEstudiante').addEventListener('click', () => this.eliminarEstudiante());

    document.getElementById('inputMontoPago').addEventListener('input', function(e) {
      let nums = e.target.value.replace(/\D/g, '');
      if (nums) e.target.value = `$${new Intl.NumberFormat('es-CO').format(nums)}`;
      else e.target.value = '';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => { ModuloEstudiantes.inicializar(); });
