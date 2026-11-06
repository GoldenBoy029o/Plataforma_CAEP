const DB = {
  catalogoMaterias: ["Matemáticas", "Geometría", "Álgebra", "Estadística", "Castellano / Lengua", "Comprensión Lectora", "Inglés", "Ciencias Naturales", "Biología", "Química", "Física", "Ciencias Sociales", "Historia", "Geografía", "Filosofía", "Ética y Valores", "Informática"],
  profesores: JSON.parse(localStorage.getItem('cae_profesores')) || [
    { id: "p1", nombre: "Profesor 1", tel: "3001234567", correo: "profe@cae.com", especialidad: "Primaria Integral" },
    { id: "p2", nombre: "Profesor 2", tel: "3119876543", correo: "marta@cae.com", especialidad: "Matemáticas y Lenguaje" }
  ],
  categorias: JSON.parse(localStorage.getItem('cae_categorias')) || {
    cat1: { titulo: "1ra Categoría (Transición a 3º Primaria)", cuposOcupados: 8, cuposTotal: 10, profesorId: "p1", horario: "Lun a Vie: 3:00 PM - 5:00 PM", tarifa: "$120.000/mes", materias: ["Matemáticas", "Ciencias Sociales", "Castellano / Lengua", "Inglés"] },
    cat3: { titulo: "3ra Categoría (Bachillerato)", cuposOcupados: 0, cuposTotal: 0, esPorHoras: true, profesorId: "p2", horario: "Horario según asignación", tarifa: "$30.000 / Hora", materias: [] }
  },
  guardar: function() {
    localStorage.setItem('cae_profesores', JSON.stringify(this.profesores));
    localStorage.setItem('cae_categorias', JSON.stringify(this.categorias));
  },
  getProfesorName: function(id) {
    const p = this.profesores.find(item => item.id === id); return p ? p.nombre : "Sin asignar";
  },
  validarSesion: function() {
    const session = JSON.parse(localStorage.getItem('cae_session') || '{}');
    if (session.role !== 'admin') window.location.href = 'index.html';
  }
};

const UI = {
  abrirModal: function(id) { const m = document.getElementById(id); if(m) { m.classList.remove('hidden'); m.classList.add('flex'); } },
  cerrarModal: function(id) { const m = document.getElementById(id); if(m) { m.classList.add('hidden'); m.classList.remove('flex'); } },
  toggleDrawer: function(open) {
    const drawer = document.getElementById('adminDrawer'); const overlay = document.getElementById('adminDrawerOverlay');
    if (open) {
      drawer.classList.remove('-translate-x-full'); overlay.classList.remove('hidden');
      ModuloProfesores.llenarSelects(); ModuloCategorias.cargarFormulario(document.getElementById('adminCatSelector').value); ModuloProfesores.renderizarLista();
    } else {
      drawer.classList.add('-translate-x-full'); overlay.classList.add('hidden');
    }
  }
};

const ModuloCategorias = {
  autoFormatTarifa: function(e) {
    let input = e.target; let rawVal = input.value.toLowerCase(); let numbers = rawVal.replace(/\D/g, ''); if (!numbers) return;
    let formatted = new Intl.NumberFormat('es-CO').format(parseInt(numbers, 10));
    let isHourlyCat = false;
    if(input.id === 'editTarifa') {
      const cat = DB.categorias[document.getElementById('adminCatSelector').value];
      isHourlyCat = cat && (cat.esPorHoras || (cat.tarifa && cat.tarifa.toLowerCase().includes('hora')));
    }
    input.value = `$${formatted}${(isHourlyCat || rawVal.includes('hora')) ? ' / Hora' : '/mes'}`;
  },
  actualizarTarjetasVista: function() {
    const container = document.getElementById('cardsCategoriasContainer'); if(!container) return; container.innerHTML = '';
    Object.keys(DB.categorias).forEach(key => {
      const cat = DB.categorias[key];
      const isHourly = cat.esPorHoras || (cat.tarifa && cat.tarifa.toLowerCase().includes('hora'));
      const isFull = !isHourly && cat.cuposOcupados >= cat.cuposTotal;
      
      let cupoBadge = isHourly ? '<span class="text-[10px] bg-sky-100 text-sky-700 font-extrabold px-2 py-0.5 rounded-md">Por Horas</span>' :
                      isFull ? `<span class="text-[10px] bg-rose-100 text-rose-700 font-extrabold px-2 py-0.5 rounded-md">${cat.cuposOcupados}/${cat.cuposTotal} (LLENO)</span>` :
                      `<span class="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md">${cat.cuposOcupados}/${cat.cuposTotal} Cupos</span>`;
      
      // Etiquetas ajustadas: tamaño text-xs estricto, redondeadas estilo píldora
      const tags = cat.materias ? cat.materias.map(m => `<span class="px-2.5 py-1 bg-violet-100 border border-violet-200 text-xs rounded-full text-violet-700 font-bold">${m}</span>`).join('') : '';
      
      container.innerHTML += `
        <div class="bg-white p-5 rounded-2xl shadow-md border border-sky-100 hover:border-violet-300 transition-colors">
          <div class="flex justify-between items-center mb-2"><span class="font-extrabold text-sm text-slate-800">${cat.titulo}</span>${cupoBadge}</div>
          <p class="text-xs text-slate-500 font-semibold mb-3">${isHourly && !cat.profesorId ? 'Por asignación' : DB.getProfesorName(cat.profesorId)} • ${cat.horario} • <span class="text-emerald-600">${cat.tarifa}</span></p>
          <div class="flex flex-wrap gap-1.5">${tags}</div>
        </div>`;
    });
    this.sincronizarSelectores();
  },
  sincronizarSelectores: function() {
    const sMain = document.getElementById('categoriaSelect'); const sAdmin = document.getElementById('adminCatSelector');
    if(!sMain || !sAdmin) return;
    const cAdmin = sAdmin.value; const cMain = sMain.value;
    sMain.innerHTML = '<option value="">Seleccione...</option>'; sAdmin.innerHTML = '';
    Object.keys(DB.categorias).forEach(key => {
      const cat = DB.categorias[key];
      const isFull = !(cat.esPorHoras || cat.tarifa.toLowerCase().includes('hora')) && cat.cuposOcupados >= cat.cuposTotal;
      const optMain = document.createElement('option'); optMain.value = key; optMain.textContent = `${cat.titulo} ${isFull ? '- (Lleno)' : ''}`;
      if (isFull) optMain.disabled = true;
      sMain.appendChild(optMain);
      sAdmin.appendChild(new Option(cat.titulo, key));
    });
    if (cAdmin && DB.categorias[cAdmin]) sAdmin.value = cAdmin; if (cMain && DB.categorias[cMain]) sMain.value = cMain;
  },
  renderMateriasChecklist: function(materias) {
    const container = document.getElementById('materiasChecklist'); if(!container) return; container.innerHTML = '';
    DB.catalogoMaterias.forEach(mat => {
      container.innerHTML += `
        <label class="flex items-center gap-2 p-1.5 hover:bg-violet-50 rounded-lg cursor-pointer text-slate-600 transition-colors">
          <input type="checkbox" name="catMateriaCheck" value="${mat}" ${materias.includes(mat) ? 'checked' : ''} class="rounded text-violet-600 focus:ring-violet-500">
          <span>${mat}</span>
        </label>`;
    });
    this.updateMateriasCount();
    container.querySelectorAll('input[type="checkbox"]').forEach(chk => chk.addEventListener('change', () => this.updateMateriasCount()));
  },
  updateMateriasCount: function() {
    const len = document.querySelectorAll('#materiasChecklist input[type="checkbox"]:checked').length;
    if(document.getElementById('countMateriasSeleccionadas')) document.getElementById('countMateriasSeleccionadas').textContent = len;
  },
  cargarFormulario: function(catKey) {
    const c = DB.categorias[catKey]; if (!c) return;
    const isHourly = c.esPorHoras || c.tarifa.toLowerCase().includes('hora');
    const adminCampos = document.getElementById('adminCamposRegulares');
    if (isHourly) {
      adminCampos.classList.add('hidden'); document.getElementById('editCapacidad').required = false; document.getElementById('editHorario').required = false;
    } else {
      adminCampos.classList.remove('hidden'); document.getElementById('editCapacidad').required = true; document.getElementById('editHorario').required = true;
      document.getElementById('editCapacidad').value = c.cuposTotal; document.getElementById('editProfesor').value = c.profesorId; document.getElementById('editHorario').value = c.horario;
      this.renderMateriasChecklist(c.materias || []);
    }
    document.getElementById('editTarifa').value = c.tarifa;
  },
  guardarEdicion: function(e) {
    e.preventDefault(); const c = DB.categorias[document.getElementById('adminCatSelector').value];
    if (!(c.esPorHoras || c.tarifa.toLowerCase().includes('hora'))) {
      const materias = Array.from(document.querySelectorAll('#materiasChecklist input[type="checkbox"]:checked')).map(chk => chk.value);
      if (materias.length === 0) return alert('Debe seleccionar al menos una materia.');
      c.cuposTotal = parseInt(document.getElementById('editCapacidad').value) || 0; c.profesorId = document.getElementById('editProfesor').value; c.horario = document.getElementById('editHorario').value.trim(); c.materias = materias;
    }
    c.tarifa = document.getElementById('editTarifa').value.trim();
    DB.guardar(); ModuloCategorias.actualizarTarjetasVista(); alert('Categoría actualizada.');
  },
  crearNueva: function(e) {
    e.preventDefault(); const newKey = "cat_" + Date.now(); const tarifaRaw = document.getElementById('newCatTarifa').value.trim(); const isHourly = tarifaRaw.toLowerCase().includes('hora');
    DB.categorias[newKey] = {
      titulo: document.getElementById('newCatTitulo').value.trim(), cuposOcupados: 0, cuposTotal: isHourly ? 0 : parseInt(document.getElementById('newCatCapacidad').value) || 10,
      profesorId: isHourly ? "" : document.getElementById('newCatProfesor').value, horario: isHourly ? "Asignación" : document.getElementById('newCatHorario').value.trim(),
      tarifa: tarifaRaw, materias: isHourly ? [] : ["Matemáticas"], esPorHoras: isHourly
    };
    DB.guardar(); ModuloCategorias.actualizarTarjetasVista(); document.getElementById('adminCatSelector').value = newKey; ModuloCategorias.cargarFormulario(newKey);
    UI.cerrarModal('modalNuevaCategoria'); document.getElementById('formNuevaCategoria').reset();
  }
};

const ModuloHorarios = {
  targetInput: null,
  abrir: function(e) {
    this.targetInput = (e.currentTarget.id.includes('New') || e.currentTarget.id === 'newCatHorario') ? document.getElementById('newCatHorario') : document.getElementById('editHorario');
    UI.abrirModal('modalHorarioPicker');
  },
  aplicar: function() {
    const checks = Array.from(document.querySelectorAll('#modalHorarioPicker input[name="diaSemana"]:checked')).map(c => c.value);
    if (checks.length === 0) return alert('Seleccione un día.');
    let diasTexto = (checks.length === 5 && checks.join(',') === 'Lun,Mar,Mié,Jue,Vie') ? 'Lun a Vie' : checks.join(', ');
    const f12 = t => { let [h,m]=t.split(':'); h=parseInt(h); return `${h%12||12}:${m} ${h>=12?'PM':'AM'}`; };
    if(this.targetInput) this.targetInput.value = `${diasTexto}: ${f12(document.getElementById('pickerHoraInicio').value)} - ${f12(document.getElementById('pickerHoraFin').value)}`;
    UI.cerrarModal('modalHorarioPicker');
  }
};

const ModuloProfesores = {
  llenarSelects: function() {
    const sEdit = document.getElementById('editProfesor'); const sNew = document.getElementById('newCatProfesor');
    if(sEdit) sEdit.innerHTML = ''; if(sNew) sNew.innerHTML = '';
    DB.profesores.forEach(p => { if(sEdit) sEdit.appendChild(new Option(`${p.nombre}`, p.id)); if(sNew) sNew.appendChild(new Option(`${p.nombre}`, p.id)); });
  },
  renderizarLista: function() {
    const list = document.getElementById('profesoresList'); if(!list) return; list.innerHTML = '';
    DB.profesores.forEach((prof, idx) => {
      list.innerHTML += `<div class="p-3 bg-white border border-sky-100 rounded-xl flex items-center justify-between text-sm shadow-sm">
        <div><div class="font-extrabold text-slate-800">${prof.nombre}</div>
        <div class="text-[11px] text-slate-500 font-bold">${prof.tel} • ${prof.especialidad}</div></div>
        <button type="button" onclick="window.deleteProfesor(${idx})" class="text-rose-500 hover:text-rose-700 font-extrabold text-xs">Eliminar</button></div>`;
    });
  },
  eliminar: function(index) {
    if (DB.profesores.length <= 1) return alert('Mínimo un profesor.');
    Object.keys(DB.categorias).forEach(k => { if (DB.categorias[k].profesorId === DB.profesores[index].id) DB.categorias[k].profesorId = DB.profesores.find(p => p.id !== DB.profesores[index].id).id; });
    DB.profesores.splice(index, 1); DB.guardar(); this.llenarSelects(); this.renderizarLista(); ModuloCategorias.actualizarTarjetasVista();
  },
  crear: function(e) {
    e.preventDefault();
    DB.profesores.push({ id: "p_" + Date.now(), nombre: document.getElementById('profNombre').value.trim(), tel: document.getElementById('profTel').value.trim(), correo: document.getElementById('profCorreo').value.trim().toLowerCase(), especialidad: document.getElementById('profEspecialidad').value.trim() });
    DB.guardar(); ModuloProfesores.llenarSelects(); ModuloProfesores.renderizarLista(); e.target.reset();
  }
};

const ModuloMatriculas = {
  acudientes: [], tempDataHoras: null, selectCategoriaPrevia: "", hourlyRateForCalc: 0,
  evaluarCambioCategoria: function() {
    const cat = DB.categorias[document.getElementById('categoriaSelect').value]; const reqBox = document.getElementById('requisitosBox');
    this.tempDataHoras = null;
    if (cat) {
      const isHourly = cat.esPorHoras || cat.tarifa.toLowerCase().includes('hora');
      if (isHourly) { this.abrirConfigHoras(document.getElementById('categoriaSelect').value); } else { document.getElementById('tarifaPreview').textContent = `Tarifa: ${cat.tarifa}`; this.selectCategoriaPrevia = document.getElementById('categoriaSelect').value; }
      if (isHourly) {
        reqBox.classList.add('opacity-40', 'pointer-events-none'); document.getElementById('chkEntrevista').checked = false; document.getElementById('chkExamen').checked = false;
      } else { reqBox.classList.remove('opacity-40', 'pointer-events-none'); }
    } else { document.getElementById('tarifaPreview').textContent = 'Tarifa: Seleccione categoría'; reqBox.classList.remove('opacity-40', 'pointer-events-none'); this.selectCategoriaPrevia = ""; }
    this.validarRequisitos();
  },
  validarRequisitos: function() {
    const cat = DB.categorias[document.getElementById('categoriaSelect').value]; const esExento = cat && (cat.esPorHoras || cat.tarifa.toLowerCase().includes('hora'));
    const listos = esExento || (document.getElementById('chkEntrevista').checked && document.getElementById('chkExamen').checked);
    const btnSubmit = document.getElementById('btnSubmitMatricula'); const badge = document.getElementById('requisitosBadge');
    if (listos && cat) {
      btnSubmit.disabled = false; btnSubmit.className = "w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3.5 rounded-xl text-sm uppercase tracking-wider cursor-pointer shadow-md transition-all"; btnSubmit.innerText = "Oficializar Matrícula";
      badge.innerHTML = esExento ? 'Requisitos: <span class="text-sky-600">Exento</span>' : 'Requisitos: <span class="text-emerald-600">Activos</span>';
    } else {
      btnSubmit.disabled = true; btnSubmit.className = "w-full bg-slate-200 text-slate-400 font-extrabold py-3.5 rounded-xl text-sm uppercase tracking-wider cursor-not-allowed transition-all"; btnSubmit.innerText = "Requisitos Incompletos"; badge.innerHTML = 'Requisitos: Pendientes';
    }
  },
  abrirConfigHoras: function(catKey) {
    this.hourlyRateForCalc = parseInt(DB.categorias[catKey].tarifa.replace(/\D/g, ''), 10) || 0;
    const selectProf = document.getElementById('configCatHorasProfesor'); selectProf.innerHTML = '';
    DB.profesores.forEach(p => selectProf.appendChild(new Option(`${p.nombre}`, p.id)));
    const matContainer = document.getElementById('cfgMateriasList'); matContainer.innerHTML = '';
    DB.catalogoMaterias.forEach(mat => { matContainer.innerHTML += `<label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" name="cfgMateriaCheck" value="${mat}" class="rounded text-violet-600"> <span>${mat}</span></label>`; });
    this.recalcularPrecioHoras(); UI.abrirModal('modalConfigCatPorHoras');
  },
  recalcularPrecioHoras: function() {
    const numDias = document.querySelectorAll('input[name="cfgDia"]:checked').length;
    let totalHoras = 0;
    if (numDias > 0) {
      const [h1, m1] = document.getElementById('cfgHoraInicio').value.split(':').map(Number); const [h2, m2] = document.getElementById('cfgHoraFin').value.split(':').map(Number);
      let diff = (h2 + m2/60) - (h1 + m1/60); if (diff > 0) totalHoras = diff * numDias;
    }
    const totalDinero = totalHoras * this.hourlyRateForCalc;
    document.getElementById('cfgPrecioCalculado').textContent = `$${new Intl.NumberFormat('es-CO').format(totalDinero)}`;
    return { totalHoras, totalDinero };
  },
  guardarConfigHoras: function(e) {
    e.preventDefault(); const resCalc = this.recalcularPrecioHoras(); if(resCalc.totalHoras <= 0) return alert('Rango inválido.');
    this.tempDataHoras = { profesorId: document.getElementById('configCatHorasProfesor').value, totalCobro: resCalc.totalDinero };
    document.getElementById('tarifaPreview').textContent = `Tarifa Calculada: $${new Intl.NumberFormat('es-CO').format(resCalc.totalDinero)}`;
    this.selectCategoriaPrevia = document.getElementById('categoriaSelect').value; UI.cerrarModal('modalConfigCatPorHoras'); this.validarRequisitos();
  },
  agregarAcudiente: function(e) {
    e.preventDefault(); this.acudientes.push({ relacion: document.getElementById('modalRelacion').value, nombre: document.getElementById('modalNombre').value.trim(), tel: document.getElementById('modalTel').value.trim(), correo: document.getElementById('modalCorreo').value.trim(), direccion: document.getElementById('modalDireccion').value.trim() });
    this.renderTablaAcudientes(); UI.cerrarModal('modalAcudiente'); document.getElementById('acudienteForm').reset();
  },
  eliminarAcudiente: function(i) { this.acudientes.splice(i, 1); this.renderTablaAcudientes(); },
  renderTablaAcudientes: function() {
    const tBody = document.getElementById('acudientesTableBody'); tBody.innerHTML = '';
    if (this.acudientes.length === 0) { tBody.innerHTML = '<tr id="emptyRow"><td colspan="5" class="p-4 text-center text-slate-400 font-semibold">No hay acudientes registrados.</td></tr>'; } 
    else { this.acudientes.forEach((item, index) => { tBody.innerHTML += `<tr class="border-b border-slate-100"><td class="p-2.5 font-bold text-slate-700">${item.relacion}</td><td class="p-2.5 font-bold text-slate-900">${item.nombre}</td><td class="p-2.5 text-slate-600">${item.tel}</td><td class="p-2.5 text-slate-600">${item.correo}</td><td class="p-2.5 text-center"><button type="button" onclick="window.deleteAcudiente(${index})" class="text-rose-500 hover:text-rose-700 font-extrabold text-xs">Eliminar</button></td></tr>`; }); }
    const btnOpen = document.getElementById('btnOpenModal'); btnOpen.disabled = this.acudientes.length >= 2; btnOpen.classList.toggle('opacity-50', this.acudientes.length >= 2);
  },
  oficializarMatricula: function(e) {
    e.preventDefault(); if (this.acudientes.length === 0) return alert('Debe registrar al menos un acudiente.');
    const doc = document.getElementById('docIdentidad').value.trim(); const cat = DB.categorias[document.getElementById('categoriaSelect').value];
    let estudiantes = JSON.parse(localStorage.getItem('cae_estudiantes')) || [];
    if(estudiantes.find(est => est.documento === doc)) return alert('Ya existe un estudiante con ese Documento.');
    
    const isHourly = cat.esPorHoras || cat.tarifa.toLowerCase().includes('hora');
    if (!isHourly) { if (cat.cuposOcupados >= cat.cuposTotal) return alert('No hay cupos.'); cat.cuposOcupados += 1; }

    const hoy = new Date(); const fechaMat = hoy.toISOString().split('T')[0]; const fechaVenc = new Date(hoy); fechaVenc.setDate(fechaVenc.getDate() + 30);
    const nuevoEstudiante = { documento: doc, nombres: document.getElementById('nombres').value.trim(), apellidos: document.getElementById('apellidos').value.trim(), categoriaId: document.getElementById('categoriaSelect').value, fechaMatricula: fechaMat, proximoPago: fechaVenc.toISOString().split('T')[0], estado: 'aldia', historialPagos: [], acudientes: [...this.acudientes] };
    if(isHourly && this.tempDataHoras) nuevoEstudiante.historialPagos.push({ fecha: fechaMat, monto: `$${new Intl.NumberFormat('es-CO').format(this.tempDataHoras.totalCobro)}` });
    
    estudiantes.push(nuevoEstudiante); localStorage.setItem('cae_estudiantes', JSON.stringify(estudiantes)); DB.guardar(); ModuloCategorias.actualizarTarjetasVista();
    alert(`¡Matrícula formalizada exitosamente!`);
    e.target.reset(); this.acudientes = []; this.tempDataHoras = null; this.selectCategoriaPrevia = ""; this.renderTablaAcudientes(); document.getElementById('categoriaSelect').dispatchEvent(new Event('change'));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  DB.validarSesion(); window.deleteProfesor = (idx) => ModuloProfesores.eliminar(idx); window.deleteAcudiente = (idx) => ModuloMatriculas.eliminarAcudiente(idx);
  ModuloCategorias.actualizarTarjetasVista();
  ['editTarifa', 'newCatTarifa'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).addEventListener('blur', ModuloCategorias.autoFormatTarifa); });
  if(document.getElementById('btnToggleAdminDrawer')) document.getElementById('btnToggleAdminDrawer').addEventListener('click', (e) => { e.preventDefault(); UI.toggleDrawer(true); });
  ['btnCloseAdminDrawer', 'adminDrawerOverlay'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).addEventListener('click', () => UI.toggleDrawer(false)); });
  
  if(document.getElementById('tabBtnCategorias')) document.getElementById('tabBtnCategorias').addEventListener('click', (e) => { e.target.className = "flex-1 py-3.5 border-b-2 border-violet-600 text-violet-700"; document.getElementById('tabBtnProfesores').className = "flex-1 py-3.5 border-b-2 border-transparent hover:text-slate-600"; document.getElementById('tabContentCategorias').classList.remove('hidden'); document.getElementById('tabContentProfesores').classList.add('hidden'); });
  if(document.getElementById('tabBtnProfesores')) document.getElementById('tabBtnProfesores').addEventListener('click', (e) => { e.target.className = "flex-1 py-3.5 border-b-2 border-violet-600 text-violet-700"; document.getElementById('tabBtnCategorias').className = "flex-1 py-3.5 border-b-2 border-transparent hover:text-slate-600"; document.getElementById('tabContentProfesores').classList.remove('hidden'); document.getElementById('tabContentCategorias').classList.add('hidden'); });
  
  if(document.getElementById('adminCatSelector')) document.getElementById('adminCatSelector').addEventListener('change', (e) => ModuloCategorias.cargarFormulario(e.target.value));
  if(document.getElementById('formEditCategoria')) document.getElementById('formEditCategoria').addEventListener('submit', ModuloCategorias.guardarEdicion);
  if(document.getElementById('btnNuevaCategoriaModal')) document.getElementById('btnNuevaCategoriaModal').addEventListener('click', () => { ModuloProfesores.llenarSelects(); UI.abrirModal('modalNuevaCategoria'); });
  ['btnCloseNuevaCatModal', 'btnCancelNuevaCatModal'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).addEventListener('click', () => UI.cerrarModal('modalNuevaCategoria')); });
  if(document.getElementById('formNuevaCategoria')) document.getElementById('formNuevaCategoria').addEventListener('submit', ModuloCategorias.crearNueva);
  if(document.getElementById('formNewProfesor')) document.getElementById('formNewProfesor').addEventListener('submit', ModuloProfesores.crear);
  
  ['btnAbrirPickerHorario', 'editHorario', 'btnAbrirPickerHorarioNew', 'newCatHorario'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).addEventListener('click', (e) => ModuloHorarios.abrir(e)); });
  if(document.getElementById('btnCloseHorarioPicker')) document.getElementById('btnCloseHorarioPicker').addEventListener('click', () => UI.cerrarModal('modalHorarioPicker'));
  if(document.getElementById('btnAceptarHorario')) document.getElementById('btnAceptarHorario').addEventListener('click', () => ModuloHorarios.aplicar());
  
  if(document.getElementById('categoriaSelect')) document.getElementById('categoriaSelect').addEventListener('change', () => ModuloMatriculas.evaluarCambioCategoria());
  ['chkEntrevista', 'chkExamen'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).addEventListener('change', () => ModuloMatriculas.validarRequisitos()); });
  if(document.getElementById('matriculaForm')) document.getElementById('matriculaForm').addEventListener('submit', ModuloMatriculas.oficializarMatricula);
  if(document.getElementById('btnCloseCatHorasModal')) document.getElementById('btnCloseCatHorasModal').addEventListener('click', () => { UI.cerrarModal('modalConfigCatPorHoras'); document.getElementById('categoriaSelect').value = ModuloMatriculas.selectCategoriaPrevia; document.getElementById('categoriaSelect').dispatchEvent(new Event('change')); });
  document.querySelectorAll('.calcular-horas').forEach(el => el.addEventListener('change', () => ModuloMatriculas.recalcularPrecioHoras()));
  if(document.getElementById('formConfigCatHoras')) document.getElementById('formConfigCatHoras').addEventListener('submit', (e) => ModuloMatriculas.guardarConfigHoras(e));
  if(document.getElementById('btnOpenModal')) document.getElementById('btnOpenModal').addEventListener('click', () => { if (ModuloMatriculas.acudientes.length >= 2) return alert('Máximo 2 acudientes.'); UI.abrirModal('modalAcudiente'); });
  ['btnCloseModal', 'btnCancelModal'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).addEventListener('click', () => UI.cerrarModal('modalAcudiente')); });
  if(document.getElementById('acudienteForm')) document.getElementById('acudienteForm').addEventListener('submit', (e) => ModuloMatriculas.agregarAcudiente(e));
});
