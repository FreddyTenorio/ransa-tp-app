<template>
  <div :class="{ 'sorting-active': sortingActive }">
    <div class="top-panel">
      <div class="panel-content">
        <h3 style="margin: 0 0 10px 0; text-align: center; font-size: 1.1em;">🚛 Gestión TP - Sincronizado</h3>
        <div class="stats-row">
          <div class="stat-item"><span class="stat-val">{{ ruta.length }}</span><span class="stat-lbl">Total</span></div>
          <div class="stat-item"><span class="stat-val" style="color: #17a2b8;">{{ countLoc }}</span><span class="stat-lbl">Ubic.</span></div>
          <div class="stat-item"><span class="stat-val" style="color: #28a745;">{{ countDel }}</span><span class="stat-lbl">Listos</span></div>
        </div>

        <div class="search-filter-row" v-show="!sortingActive">
          <input type="text" v-model="searchName" placeholder="🔍 Buscar cliente por nombre..." class="search-input">
          <div class="type-chips">
            <button @click="typeFilter = 'TODOS'" :class="{ active: typeFilter === 'TODOS' }">Todos</button>
            <button @click="typeFilter = 'ENTREGA'" :class="{ active: typeFilter === 'ENTREGA', 'active-ent': typeFilter === 'ENTREGA' }">Entregas</button>
            <button @click="typeFilter = 'RECOJO'" :class="{ active: typeFilter === 'RECOJO', 'active-rec': typeFilter === 'RECOJO' }">Recojos</button>
            <button @click="typeFilter = 'INTERCAMBIO'" :class="{ active: typeFilter === 'INTERCAMBIO', 'active-int': typeFilter === 'INTERCAMBIO' }">Interc.</button>
          </div>
        </div>

        <div class="top-controls">
          <button class="btn-toggle-filters" @click="filtersOpen = !filtersOpen">🔽 Filtros Extra</button>
          <button class="btn-sort-mode" :class="{ active: sortingActive }" @click="toggleSortMode">
            {{ sortingActive ? '✅ Guardar Orden' : '⇄ Organizar' }}
          </button>
        </div>
        <div class="filters-container" :class="{ open: filtersOpen }">
          <div class="filters-row">
            <div class="filter-toggle">
              <input type="checkbox" id="f-loc" v-model="filters.hideLoc" @change="applyFilters">
              <label for="f-loc">Ocultar con Ubicación</label>
            </div>
            <div class="filter-toggle">
              <input type="checkbox" id="f-del" v-model="filters.hideDel" @change="applyFilters">
              <label for="f-del">Ocultar Listos / Entregados</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="lista" ref="listaRef" style="padding-top: 240px; padding-bottom: 100px;">
      <div v-if="ruta.length === 0" class="empty-state">
        <span class="empty-icon">☁️</span>
        <h3>Base de datos vacía</h3>
        <p>Abre el Menú ⚙️ y carga tu archivo Excel.</p>
      </div>

      <div 
        v-for="(c, index) in ruta" 
        :key="c.guid" 
        class="card"
        :class="{ 'is-delivered': c.del, 'has-location': c.loc, 'is-cancelled': c.cancelado, 'hidden': isHidden(c) }"
        :data-id="c.guid"
      >
        <div class="header">
          <div class="drag-handle">☰</div>
          <div style="flex-grow:1; padding-right:10px;">
            <span class="name">{{ index + 1 }}. {{ c.nom }}</span>
            <span class="phone">📞 {{ c.tel }} <button style="background:none;border:none;cursor:pointer;" @click="editPhone(c)">✏️</button></span>
          </div>
          <div class="header-right">
            <div class="stop-number">#{{ index + 1 }}</div>
            <div class="badge-type" :class="getTypeClass(c.tipo)">{{ c.tipo }}</div>
            <button class="btn-edit-modal" @click="openModal(c)">👁️ Editar</button>
          </div>
        </div>

        <div class="card-info">
          <div><strong>📍 Dir:</strong> {{ c.addr }}</div>
          <div><strong>📦 Detalle:</strong> {{ c.desc }} <span v-if="c.cc">(CC: {{ c.cc }})</span></div>
        </div>

        <div class="actions">
          <a class="btn btn-call" :href="c.tel !== 'Sin Celular' ? 'tel:'+c.tel : '#'">Llamar</a>
          <a class="btn btn-msg1" :href="getLinkManana(c)" target="_blank">Mañana</a>
          <a class="btn btn-msg2" :href="getLinkCamino(c)" target="_blank">Ya voy</a>
        </div>

        <div class="report-row">
          <a class="btn-report-issue btn-nowa" :href="getLinkNoWa(c, index+1)" target="_blank">🚫 Sin WA</a>
          <a class="btn-report-issue btn-wrong-num" :href="getLinkWrongNum(c, index+1)" target="_blank">📞❌ Num Error</a>
          <a class="btn-report-issue btn-bad-loc" :href="getLinkBadLoc(c, index+1)" target="_blank">📍❌ Ubic Mal</a>
          
          <a class="btn-report-issue btn-rechazo" :href="getLinkRechazo(c)" target="_blank" @click="marcarRechazo(c)">⛔ Rechazo</a>
        </div>

        <div class="loc-section">
          <div class="loc-header">
            <div class="check-group">
              <input type="checkbox" class="check-box" :id="'loc-'+c.guid" v-model="c.loc" @change="saveData">
              <label :for="'loc-'+c.guid" class="check-label">Ubicación</label>
            </div>
            <div class="check-group">
              <input type="checkbox" class="check-box" :id="'can-'+c.guid" v-model="c.cancelado" @change="saveData">
              <label :for="'can-'+c.guid" class="check-label" style="color:#dc3545;">¿Cancel?</label>
            </div>
          </div>
          <input type="text" class="input-link" placeholder="Pegar Link Maps..." v-model="c.link" @input="handleLinkInput(c)">
          <a class="btn-report-base" :class="{ ready: c.link }" :href="c.link ? `https://wa.me/${numeroBase}?text=${encodeURIComponent('Ubicación de '+c.nom+': '+c.link)}` : '#'" target="_blank">
            👮 Reportar Ubicación
          </a>
        </div>

        <button class="btn-done" :class="{ active: c.del }" @click="toggleDel(c)">
          {{ c.del ? 'ENTREGADO / LISTO' : 'MARCAR LISTO' }}
        </button>
      </div>
    </div>

    <div class="modal-overlay" :class="{ open: modalOpen }">
      <div class="modal-content">
        <div class="modal-header">
          <span>Editar Cliente</span>
          <span style="cursor:pointer" @click="modalOpen = false">✕</span>
        </div>
        <div v-if="modalData">
          <div style="font-weight:bold; margin-bottom:3px;">Nombre:</div>
          <div style="margin-bottom:15px; color:#555;">{{ modalData.nom }}</div>
          
          <div style="font-weight:bold; margin-bottom:3px;">Dirección:</div>
          <textarea class="modal-input" v-model="modalData.addr" placeholder="Escribe la dirección..."></textarea>
          
          <div style="font-weight:bold; margin-bottom:3px;">Motivo/Detalle:</div>
          <textarea class="modal-input" v-model="modalData.desc" placeholder="Motivo de la carga..."></textarea>
        </div>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button style="flex:1; padding:12px; border-radius:8px; border:none; font-weight:bold; cursor:pointer; background:#dc3545; color:white;" @click="modalOpen = false">Cancelar</button>
          <button style="flex:1; padding:12px; border-radius:8px; border:none; font-weight:bold; cursor:pointer; background:#0d6efd; color:white;" @click="saveModalChanges">💾 Guardar</button>
        </div>
      </div>
    </div>

    <div class="fab" @click="menuOpen = !menuOpen">⚙️</div>
    <div class="menu-overlay" :class="{ open: menuOpen }" @click="menuOpen = false"></div>
    <div class="slide-menu" :class="{ open: menuOpen }">
      <h3 style="text-align:center; margin-top:0;">Gestión Nube TP</h3>
      
      <input type="file" id="excelInput" accept=".xlsx, .xls, .csv" style="display: none;" @change="handleFileUpload">
      <label for="excelInput" class="btn-upload-label btn-excel">1️⃣ Cargar Excel TP (Multihoja)</label>
      
      <button class="btn-upload-label btn-vcf-out" @click="downloadVCF">📲 2️⃣ Exportar Contactos VCF</button>
      
      <div class="divider">--- PELIGRO ---</div>
      <button class="btn-upload-label" style="background:#dc3545;" @click="clearAllData">🗑️ Borrar Ruta de la Nube</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from './firebase.js';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import Sortable from 'sortablejs';

// --- CONFIGURACIÓN ---
const numeroBase = "51997158334";
const docRef = doc(db, 'rutas', 'ruta_diaria');

// --- ESTADOS ---
const ruta = ref([]);
const filtersOpen = ref(false);
const filters = ref({ hideLoc: false, hideDel: false });
const sortingActive = ref(false);
const menuOpen = ref(false);
const modalOpen = ref(false);
const modalData = ref(null);
const listaRef = ref(null);
let sortableInstance = null;

// NUEVOS ESTADOS PARA BUSCADOR Y FILTROS
const searchName = ref("");
const typeFilter = ref("TODOS");

// --- ESTADÍSTICAS ---
const countLoc = computed(() => ruta.value.filter(c => c.loc).length);
const countDel = computed(() => ruta.value.filter(c => c.del).length);

// --- CONEXIÓN A FIREBASE EN TIEMPO REAL ---
onMounted(() => {
  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      ruta.value = docSnap.data().lista || [];
    } else {
      ruta.value = [];
    }
  });
});

const saveData = async () => {
  try {
    await setDoc(docRef, { lista: ruta.value });
  } catch (error) {
    console.error("Error guardando en la nube: ", error);
  }
};

// --- LECTOR DE EXCEL (MULTIHOJA) ---
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      let newRuta = [];

      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        
        json.forEach(row => {
          if (!row.NOMBRE && !row.DOCUMENTO && !row.GUIA) return;
          
          const cleanTel = String(row.TELEFONO || "").replace(/\D/g, "");
          const finalTel = (cleanTel.length >= 9) ? (cleanTel.startsWith("51") ? cleanTel : "51" + cleanTel) : "Sin Celular";
          
          let tipo = "ENTREGA";
          const mot = String(row.MOTIVO || "").toUpperCase();
          const sName = sheetName.toUpperCase();
          
          if (mot.includes("INTERCAMBIO") || sName.includes("INTERCAMBIO") || mot.includes("CAMBIO") || sName.includes("CAMBIO")) {
            tipo = "INTERCAMBIO";
          } else if (mot.includes("RECOJO") || sName.includes("RECOJO")) {
            tipo = "RECOJO";
          }

          newRuta.push({
            guid: row.GUIA ? String(row.GUIA) : Math.random().toString(36),
            dni: String(row.DOCUMENTO || ""),
            nom: row.NOMBRE || "Sin Nombre",
            addr: `${row.DIRECCIÓN || ''}, ${row.DISTRITO || ''}`.replace(/^, |, $/g, ''),
            tel: finalTel,
            desc: row.MOTIVO || "",
            cc: row.CC || "",
            tipo: tipo,
            loc: false,
            link: "",
            del: false,
            cancelado: false
          });
        });
      });
      
      if(newRuta.length > 0) {
        ruta.value = newRuta;
        saveData(); 
        menuOpen.value = false;
        alert(`✅ EXTRACCIÓN EXITOSA: ${ruta.value.length} clientes subidos a la nube.`);
      } else {
        alert("❌ El archivo está vacío o no tiene las columnas correctas (GUIA, DOCUMENTO, NOMBRE...).");
      }
    } catch(err) {
      alert("❌ Error procesando el archivo Excel.");
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
  event.target.value = null;
};

// --- WHATSAPP MENSAJES ---
const getTomorrowLabel = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[tomorrow.getDay()].toUpperCase();
};

const getLinkManana = (c) => {
  if (c.tel === "Sin Celular") return "#";
  const ccText = c.cc ? `🏢 *Campaña:* ${c.cc}\n` : "";
  const msg = `Hola, le saludamos del equipo de reparto de Teleperformance. Le escribimos para coordinar su *${c.tipo.toLowerCase()}* programado para *MAÑANA ${getTomorrowLabel()}*.\n\nTenemos registrado lo siguiente:\n📍 *Dirección:* ${c.addr}\n📦 *Detalle:* ${c.desc}\n${ccText}\n¿Nos confirma si la dirección es correcta? Por favor, envíenos también su *ubicación de Google Maps* actual para evitar confusiones al llegar.`;
  return `https://wa.me/${c.tel}?text=${encodeURIComponent(msg)}`;
};

const getLinkCamino = (c) => c.tel !== "Sin Celular" ? `https://wa.me/${c.tel}?text=${encodeURIComponent("Estamos a X minutos de su ubicación.")}` : "#";
const getLinkNoWa = (c, num) => `https://wa.me/${numeroBase}?text=${encodeURIComponent(`⚠️ REPORTE: Parada #${num} - ${c.nom} - SIN WHATSAPP`)}`;
const getLinkWrongNum = (c, num) => `https://wa.me/${numeroBase}?text=${encodeURIComponent(`⚠️ REPORTE: Parada #${num} - NUMERO EQUIVOCADO\n*Cliente:* ${c.nom}\n*Número registrado:* ${c.tel}`)}`;
const getLinkBadLoc = (c, num) => `https://wa.me/${numeroBase}?text=${encodeURIComponent(`⚠️ REPORTE: Parada #${num} - ${c.nom} - UBICACION INCORRECTA`)}`;
const getLinkRechazo = (c) => `https://wa.me/${numeroBase}?text=${encodeURIComponent(`⚠️ REPORTE DE RECHAZO ⚠️\n*DNI:* ${c.dni || 'Sin DNI'}\n*Cliente:* ${c.nom}\n*Campaña:* ${c.cc || 'Sin CC'}\n*Motivo:* ${c.desc}`)}`;

// --- INTERACCIÓN Y UI ---

// NUEVA FUNCIÓN: Auto-Cancelar y Sincronizar en Nube
const marcarRechazo = (c) => {
  c.cancelado = true;
  saveData(); // Esto dispara la actualización a todos los dispositivos en tiempo real
};

// ACTUALIZADO: isHidden ahora incluye los nuevos filtros
const isHidden = (c) => {
  if (sortingActive.value) return false; 
  if (filters.value.hideLoc && c.loc) return true;
  if (filters.value.hideDel && c.del) return true;
  
  // Filtro por nombre
  if (searchName.value && !c.nom.toLowerCase().includes(searchName.value.toLowerCase())) return true;
  
  // Filtro por tipo de carga
  if (typeFilter.value !== 'TODOS' && c.tipo !== typeFilter.value) return true;
  
  return false;
};

// Necesario para forzar la actualización visual al cambiar filtros
const applyFilters = () => { /* Vue reactividad hace esto automático al usar isHidden en el template */ };

const getTypeClass = (tipo) => {
  if (tipo === "RECOJO") return "type-recojo";
  if (tipo === "CAMBIO" || tipo === "INTERCAMBIO") return "type-cambio";
  return "type-entrega";
};

const handleLinkInput = (c) => {
  if (c.link.length > 5) c.loc = true;
  saveData();
};

const toggleDel = (c) => {
  c.del = !c.del;
  saveData();
};

const editPhone = (c) => {
  const newTel = prompt(`Editar celular para ${c.nom}:`, c.tel);
  if (newTel) { c.tel = newTel.trim(); saveData(); }
};

// --- MODAL EDITAR ---
const openModal = (c) => {
  modalData.value = { ...c };
  modalOpen.value = true;
};

const saveModalChanges = () => {
  const index = ruta.value.findIndex(r => r.guid === modalData.value.guid);
  if (index !== -1) {
    ruta.value[index].addr = modalData.value.addr;
    ruta.value[index].desc = modalData.value.desc;
    saveData();
  }
  modalOpen.value = false;
};

// --- MODO ORGANIZAR (SORTABLE) ---
const toggleSortMode = () => {
  sortingActive.value = !sortingActive.value;
  
  if (sortingActive.value) {
    if (sortableInstance) sortableInstance.destroy();
    sortableInstance = Sortable.create(listaRef.value, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost'
    });
    filtersOpen.value = false;
  } else {
    // Leer nuevo orden
    const newRuta = [];
    document.querySelectorAll('.card').forEach(cardEl => {
      const guid = cardEl.getAttribute('data-id');
      const item = ruta.value.find(r => r.guid === guid);
      if (item) newRuta.push(item);
    });
    ruta.value = newRuta;
    saveData();
    if (sortableInstance) sortableInstance.destroy();
  }
};

// --- DESCARGAR VCF ---
const downloadVCF = () => {
  if (!ruta.value.length) return alert("❌ No hay datos en la nube.");
  
  const d = new Date();
  const dateStr = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
  
  let content = "";
  let expCount = 0;
  ruta.value.forEach((c, i) => {
    if (!c.tel || c.tel === "Sin Celular") return;
    content += `BEGIN:VCARD\nVERSION:3.0\nFN:${i+1} ${c.nom} ${dateStr}\nTEL;TYPE=CELL:${c.tel}\nEND:VCARD\n`;
    expCount++;
  });
  
  if(expCount === 0) return alert("❌ No hay celulares válidos.");
  
  const blob = new Blob([content], {type: "text/vcard"});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Contactos_TP_${dateStr}.vcf`;
  a.click();
  menuOpen.value = false;
};

// --- LIMPIAR NUBE ---
const clearAllData = async () => {
  if(confirm("⚠️ PELIGRO: ¿Borrar toda la ruta de la Nube para todos los usuarios?")) {
    ruta.value = [];
    await saveData();
    menuOpen.value = false;
  }
};
</script>

<style scoped>
/* CSS MODERNO PARA VUE */
.top-panel { position: fixed; top: 0; left: 0; right: 0; background: #212529; color: white; padding: 0; z-index: 9000; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
.panel-content { padding: 10px; }
.stats-row { display: flex; justify-content: space-between; margin-bottom: 5px; gap: 4px; }
.stat-item { text-align: center; flex: 1; background: #343a40; border-radius: 5px; padding: 4px 0; }
.stat-val { font-weight: bold; font-size: 1.1em; display: block; }
.stat-lbl { font-size: 0.65em; text-transform: uppercase; color: #adb5bd; }

/* NUEVO CSS BÚSQUEDA Y FILTROS */
.search-filter-row { margin-top: 8px; margin-bottom: 8px; }
.search-input { width: 100%; padding: 8px 12px; border-radius: 6px; border: none; font-size: 0.95em; box-sizing: border-box; margin-bottom: 8px; outline: none; }
.type-chips { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 2px;}
.type-chips button { flex: 1; border: none; padding: 6px 2px; border-radius: 6px; font-size: 0.75em; font-weight: bold; cursor: pointer; background: #495057; color: white; white-space: nowrap; }
.type-chips button.active-ent { background: #0d6efd; color: white; }
.type-chips button.active-rec { background: #6f42c1; color: white; }
.type-chips button.active-int { background: #fd7e14; color: white; }
.type-chips button.active { background: #ffc107; color: black; }

.top-controls { display: flex; gap: 5px; margin-top: 5px; }
.btn-toggle-filters { flex: 1; background: #495057; border: 1px solid #6c757d; color: white; padding: 10px; border-radius: 6px; font-weight: bold; font-size: 0.9em; cursor: pointer; }
.btn-sort-mode { flex: 1; background: #0d6efd; border: 1px solid #0a58ca; color: white; padding: 10px; border-radius: 6px; font-weight: bold; font-size: 0.9em; cursor: pointer; }
.btn-sort-mode.active { background: #ffc107; color: black; border-color: #e0a800; }
.filters-container { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; background: #2b3035; border-radius: 0 0 8px 8px; margin-top: 5px; }
.filters-container.open { max-height: 300px; padding: 10px; overflow-y: auto; border-top: 1px solid #495057; }
.filters-row { display: flex; flex-direction: column; gap: 8px; }
.filter-toggle { display: flex; align-items: center; background: #343a40; padding: 8px; border-radius: 6px; }
.filter-toggle input { transform: scale(1.4); margin-right: 10px; }
.filter-toggle label { font-size: 0.9em; flex-grow: 1; color: #e9ecef; }
.empty-state { text-align: center; padding: 60px 20px; color: #6c757d; }
.empty-icon { font-size: 4em; display: block; }

.card { background: white; padding: 15px; margin-bottom: 15px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.08); border-left: 6px solid #ffc107; transition: all 0.3s ease; }
.card.hidden { display: none !important; }
.card.has-location { border-left-color: #17a2b8; } 
.card.is-delivered { border-left-color: #28a745; background-color: #e2e6ea; opacity: 0.7; }
/* Tarjeta gris y opaca cuando se marca Rechazo/Cancelado */
.card.is-cancelled { opacity: 0.6; filter: grayscale(100%); border-left-color: #dc3545; }

.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px; }
.name { font-weight: bold; color: #333; font-size: 1.1em; display: block; line-height: 1.2; }
.phone { color: #666; font-size: 0.9em; margin-top: 2px; display: flex; align-items: center; gap: 5px; }
.header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.stop-number { background: #e9ecef; color: #6c757d; padding: 4px 8px; border-radius: 4px; font-size: 0.9em; font-weight: bold; margin-bottom: 4px; border: 1px solid #ced4da;}
.badge-type { font-size: 0.75em; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; color: white; text-align: center; min-width: 60px; }
.type-entrega { background-color: #0d6efd; }
.type-recojo { background-color: #6f42c1; }
.type-cambio { background-color: #fd7e14; }
.card-info { background: #f8f9fa; padding: 8px 10px; border-radius: 6px; font-size: 0.85em; color: #495057; margin-bottom: 10px; border: 1px dashed #ced4da; }
.card-info div { margin-bottom: 4px; line-height: 1.3; }
.actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; margin-bottom: 8px; }
.btn { display: flex; align-items: center; justify-content: center; gap: 5px; padding: 10px; border-radius: 6px; text-decoration: none; color: white; font-size: 0.85em; font-weight: bold; }
.btn-call { background-color: #495057; }
.btn-msg1 { background-color: #25D366; }
.btn-msg2 { background-color: #075e54; }
.report-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 5px; margin-bottom: 12px; }
.btn-report-issue { display: flex; align-items: center; justify-content: center; gap: 3px; font-size: 0.65em; font-weight: bold; padding: 8px 2px; border-radius: 4px; text-decoration: none; border: 1px solid transparent; color: #333; text-align: center; cursor: pointer; }
.btn-nowa { background-color: #e2e3e5; border-color: #d6d8db; }
.btn-wrong-num { background-color: #fff3cd; border-color: #ffecb5; color: #856404; }
.btn-bad-loc { background-color: #cff4fc; border-color: #b6effb; color: #055160; }
.btn-rechazo { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
.loc-section { background: #f1f3f5; padding: 10px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 10px; }
.loc-header { display: flex; flex-wrap: wrap; gap: 15px; align-items: center; margin-bottom: 8px; }
.check-group { display: flex; align-items: center; }
.check-box { transform: scale(1.4); margin-right: 6px; }
.check-label { font-weight: bold; color: #495057; font-size: 0.9em; }
.input-link { width: 94%; padding: 10px; margin-bottom: 8px; border: 1px solid #ced4da; border-radius: 4px; font-size: 0.9em; box-sizing: border-box; }
.btn-report-base { display: block; width: 100%; text-align: center; padding: 10px 0; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 0.9em; color: white; background-color: #6c757d; }
.btn-report-base.ready { background-color: #0d6efd; }
.btn-done { width: 100%; padding: 12px; border: 2px solid #28a745; border-radius: 8px; cursor: pointer; font-size: 1em; font-weight: bold; background: white; color: #28a745; }
.btn-done.active { background-color: #28a745; color: white; }

/* SORTING ACTIVE COMPACTO */
.sorting-active .card { padding: 5px 10px; margin-bottom: 5px; min-height: 40px; display: flex; align-items: center; justify-content: space-between; }
.sorting-active .header { border: none; margin: 0; padding: 0; width: 100%; align-items: center;}
.sorting-active .header-right, .sorting-active .actions, .sorting-active .report-row, .sorting-active .loc-section, .sorting-active .btn-done, .sorting-active .phone, .sorting-active .card-info { display: none !important; }
.sorting-active .name { font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 75vw; margin:0;}
.drag-handle { display: none; font-size: 1.5em; color: #adb5bd; cursor: grab; padding-right: 10px; }
.sorting-active .drag-handle { display: block; }
.sortable-ghost { opacity: 0.4; background: #e9ecef; border: 2px dashed #999; }

/* MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 11000; display: none; justify-content: center; align-items: center; padding: 20px; }
.modal-overlay.open { display: flex; }
.modal-content { background: white; border-radius: 12px; width: 100%; max-width: 400px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); max-height: 85vh; overflow-y: auto; display: flex; flex-direction: column; }
.modal-header { font-size: 1.2em; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; display: flex; justify-content: space-between; }
.modal-input { width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 6px; font-family: inherit; margin-bottom: 15px; resize: vertical; min-height: 60px; background: #f8f9fa; box-sizing: border-box;}

/* FAB & MENU */
.fab { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background-color: #0d6efd; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; cursor: pointer; z-index: 10000; }
.menu-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9998; display: none; }
.menu-overlay.open { display: block; }
.slide-menu { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 25px; z-index: 9999; transform: translateY(100%); transition: transform 0.3s ease-out; box-shadow: 0 -5px 15px rgba(0,0,0,0.2); }
.slide-menu.open { transform: translateY(0); }
.btn-upload-label { color: white; text-align: center; padding: 14px; border-radius: 8px; font-weight: bold; cursor: pointer; display: block; margin-bottom: 10px; width: 100%; border: none; box-sizing: border-box; }
.btn-excel { background-color: #198754; } 
.btn-vcf-out { background-color: #0d6efd; }
.divider { text-align: center; font-size: 0.8em; color: #aaa; margin: 15px 0 10px 0; }
.btn-edit-modal { background:#e7f5ff; border:1px solid #0d6efd; color:#0d6efd; border-radius:4px; margin-top:4px; padding:2px 8px; font-weight:bold; cursor:pointer; }
</style>