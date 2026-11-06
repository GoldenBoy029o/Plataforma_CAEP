const DB_Estudiantes = {
  categorias: JSON.parse(localStorage.getItem('cae_categorias')) || {},
  estudiantes: JSON.parse(localStorage.getItem('cae_estudiantes')) || [],
  guardar: function() {
    localStorage.setItem('cae_estudiantes', JSON.stringify(this.estudiantes));
    localStorage.setItem('cae_categorias', JSON.stringify(this.categorias));
  }
};

const ModuloEstudiantes = {
  inicializar: function() { this.poblarFiltroCategorias(); this.actualizarEstadosMora(); this.renderizarTabla(); this.asignarEventos(); },
  poblarFiltroCategorias: function() {
    const sC = document.getElementById('filtroCategoria'); const sE = document.getElementById('editCategoriaSelect');
    if(sC) sC.innerHTML = '<option value="todas">Todas</option>'; if(sE) sE.innerHTML = '';
    Object.keys(DB_Estudiantes.categorias).forEach(key => {
      if(sC) sC.appendChild(new Option(DB_Estudiantes.categorias[key].titulo, key));
      if(sE) sE.appendChild(new Option(DB_Estudiantes.categorias[key].titulo, key));
    });
  },
  actualizarEstadosMora: function() {
    const hoy = new Date(); hoy.setHours(0,0,0,0); let moraCount = 0;
    DB_Estudiantes.estudiantes.forEach(est => {
      const fVenc = new Date(est.proximoPago + "T00:00:00"); const fLim = new Date(fVenc); fLim.setDate(fLim.getDate() + 5); 
      if (hoy > fLim) { est.estado = 'mora'; moraCount++; } else if (hoy > fVenc && hoy <= fLim) { est.estado = 'gracia'; } else { est.estado = 'aldia'; }
    });
    DB_Estudiantes.guardar(); if(document.getElementById('contadorMoraTop')) document.getElementById('contadorMoraTop').textContent = moraCount;
  },
  renderizarTabla: function() {
    const tbody = document.getElementById('tablaEstudiantes'); if(!tbody) return;
    const fT = document.getElementById('filtroBuscar').value.toLowerCase(); const fC = document.getElementById('filtroCategoria').value; const fE = document.getElementById('filtroEstado').value;
    tbody.innerHTML = ''; let filtrados = 0;

    DB_Estudiantes.estudiantes.forEach(est => {
      if ((est.nombres.toLowerCase().includes(fT) || est.apellidos.toLowerCase().includes(fT) || est.documento.includes(fT)) && (fC === 'todas' || est.categoriaId === fC) && (fE === 'todos' || est.estado === fE)) {
        filtrados++; const catName = DB_Estudiantes.categorias[est.categoriaId] ? DB_Estudiantes.categorias[est.categoriaId].titulo : 'Sin categoría';
        
        let bEst = est.estado === 'mora' ? '<span class="px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 font-extrabold uppercase text-[10px]">En Mora</span>' :
                   est.estado === 'gracia' ? '<span class="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 font-extrabold uppercase text-[10px]">Per. Gracia</span>' :
                   '<span class="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 font-extrabold uppercase text-[10px]">Al Día</span>';

        tbody.innerHTML += `
          <tr class="hover:bg-violet-50 transition-colors group cursor-pointer border-b border-slate-100" onclick="ModuloEstudiantes.abrirModalEdicion('${est.documento}')">
            <td class="p-4 font-extrabold text-slate-600">${est.documento}</td>
            <td class="p-4 font-extrabold text-slate-800">${est.nombres} ${est.apellidos}</td>
            <td class="p-4 text-slate-500 font-semibold truncate max-w-[150px]">${catName}</td>
            <td class="p-4 text-slate-500 font-semibold">${est.fechaMatricula}</td>
            <td class="p-4 font-extrabold ${est.estado === 'mora' ? 'text-rose-600' : 'text-slate-700'}">${est.proximoPago}</td>
            <td class="p-4 text-center">${bEst}</td>
            <td class="p-4 text-center"><button class="text-violet-600 font-extrabold hover:text-violet-800 text-[11px] bg-violet-100 px-2.5 py-1 rounded-md">Gestionar</button></td>
          </tr>`;
      }
    });
    if (filtrados === 0) tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-slate-400 font-bold">No se encontraron estudiantes.</td></tr>';
    if(document.getElementById('totalEstudiantesBadge')) document.getElementById('totalEstudiantesBadge').textContent = `Total: ${filtrados}`;
  },
  abrirModalEdicion: function(docId) {
    const est = DB_Estudiantes.estudiantes.find(e => e.documento === docId); if (!est) return;
    document.getElementById('editEstudianteId').value = est.documento; document.getElementById('modalDocEstudiante').textContent = `Documento: ${est.documento}`;
    document.getElementById('editNombres').value = est.nombres; document.getElementById('editApellidos').value = est.apellidos;
    document.getElementById('editCategoriaSelect').value = est.categoriaId; document.getElementById('infoFechaMatricula').textContent = est.fechaMatricula;
    document.getElementById('editFechaProximoPago').value = est.proximoPago;

    const b = document.getElementById('estadoPagoBadge');
    if (est.estado === 'mora') { b.className = "text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200"; b.textContent = "EN MORA"; } 
    else if (est.estado === 'gracia') { b.className = "text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200"; b.textContent = "EN GRACIA"; } 
    else { b.className = "text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200"; b.textContent = "AL DÍA"; }

    const lista = document.getElementById('listaHistorialPagos'); lista.innerHTML = '';
    if(!est.historialPagos || est.historialPagos.length === 0) { lista.innerHTML = '<div class="text-xs text-slate-400 font-semibold py-2">No hay pagos registrados.</div>'; } 
    else {
      [...est.historialPagos].reverse().forEach((pago, index) => {
        lista.innerHTML += `<div class="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 text-xs mb-1.5 shadow-sm">
            <span class="font-extrabold text-slate-600">Pago #${est.historialPagos.length - index}</span>
            <span class="text-slate-400 font-semibold">${pago.fecha}</span>
            <span class="font-extrabold text-emerald-600">${pago.monto}</span>
          </div>`;
      });
    }
    document.getElementById('inputMontoPago').value = '';
    const modal = document.getElementById('modalEdicionEstudiante'); modal.classList.remove('hidden'); modal.classList.add('flex');
  },
  cerrarModal: function() { const m = document.getElementById('modalEdicionEstudiante'); if(m) { m.classList.add('hidden'); m.classList.remove('flex'); } },
  registrarPago: function() {
    const doc = document.getElementById('editEstudianteId').value; const est = DB_Estudiantes.estudiantes.find(e => e.documento === doc);
    const montoRaw = document.getElementById('inputMontoPago').value.replace(/\D/g, ''); if (!montoRaw) return alert('Ingrese un monto válido.');
    
    const hoy = new Date(); const fechaNueva = new Date(hoy); fechaNueva.setDate(fechaNueva.getDate() + 30);
    if(!est.historialPagos) est.historialPagos = [];
    est.historialPagos.push({ fecha: hoy.toISOString().split('T')[0], monto: `$${new Intl.NumberFormat('es-CO').format(montoRaw)}` });
    est.proximoPago = fechaNueva.toISOString().split('T')[0];
    
    DB_Estudiantes.guardar(); this.actualizarEstadosMora(); this.renderizarTabla(); this.abrirModalEdicion(doc);
    alert(`Abono registrado. Próximo vencimiento: ${est.proximoPago}.`);
  },
  guardarEdicion: function(e) {
    e.preventDefault(); const est = DB_Estudiantes.estudiantes.find(ev => ev.documento === document.getElementById('editEstudianteId').value);
    const catAnt = est.categoriaId; const catNue = document.getElementById('editCategoriaSelect').value;
    est.nombres = document.getElementById('editNombres').value.trim(); est.apellidos = document.getElementById('editApellidos').value.trim(); est.categoriaId = catNue; est.proximoPago = document.getElementById('editFechaProximoPago').value;
    if (catAnt !== catNue) {
      if(DB_Estudiantes.categorias[catAnt] && !DB_Estudiantes.categorias[catAnt].esPorHoras) DB_Estudiantes.categorias[catAnt].cuposOcupados = Math.max(0, DB_Estudiantes.categorias[catAnt].cuposOcupados - 1);
      if(DB_Estudiantes.categorias[catNue] && !DB_Estudiantes.categorias[catNue].esPorHoras) DB_Estudiantes.categorias[catNue].cuposOcupados += 1;
    }
    DB_Estudiantes.guardar(); this.actualizarEstadosMora(); this.renderizarTabla(); this.cerrarModal(); alert('Datos actualizados.');
  },
  eliminarEstudiante: function() {
    const doc = document.getElementById('editEstudianteId').value;
    if (!confirm(`¿Eliminar al estudiante ${doc} junto con todo su historial?`)) return;
    const idx = DB_Estudiantes.estudiantes.findIndex(e => e.documento === doc);
    if (DB_Estudiantes.categorias[DB_Estudiantes.estudiantes[idx].categoriaId] && !DB_Estudiantes.categorias[DB_Estudiantes.estudiantes[idx].categoriaId].esPorHoras) {
      DB_Estudiantes.categorias[DB_Estudiantes.estudiantes[idx].categoriaId].cuposOcupados = Math.max(0, DB_Estudiantes.categorias[DB_Estudiantes.estudiantes[idx].categoriaId].cuposOcupados - 1);
    }
    DB_Estudiantes.estudiantes.splice(idx, 1); DB_Estudiantes.guardar(); this.actualizarEstadosMora(); this.renderizarTabla(); this.cerrarModal();
  },
  asignarEventos: function() {
    ['filtroBuscar', 'filtroCategoria', 'filtroEstado'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).addEventListener(id==='filtroBuscar'?'input':'change', () => this.renderizarTabla()); });
    ['btnCloseEditModal', 'btnCancelEdit'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).addEventListener('click', () => this.cerrarModal()); });
    if(document.getElementById('formEditarEstudiante')) document.getElementById('formEditarEstudiante').addEventListener('submit', (e) => this.guardarEdicion(e));
    if(document.getElementById('btnRegistrarPago')) document.getElementById('btnRegistrarPago').addEventListener('click', () => this.registrarPago());
    if(document.getElementById('btnEliminarEstudiante')) document.getElementById('btnEliminarEstudiante').addEventListener('click', () => this.eliminarEstudiante());
    if(document.getElementById('inputMontoPago')) document.getElementById('inputMontoPago').addEventListener('input', e => { let n = e.target.value.replace(/\D/g, ''); e.target.value = n ? `$${new Intl.NumberFormat('es-CO').format(n)}` : ''; });
  }
};
document.addEventListener('DOMContentLoaded', () => ModuloEstudiantes.inicializar());
