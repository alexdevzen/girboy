// Constantes para elementos del DOM
const DOM = {
    formularioTrabajo: document.getElementById('formularioTrabajo'),
    formularioFiltro: document.getElementById('formularioFiltro'),
    ciudad: document.getElementById('ciudad'),
    codigoCliente: document.getElementById('codigoCliente'),
    tipoValor: document.getElementById('tipoValor'),
    multiplicador: document.getElementById('multiplicador'),
    multiplicadorGroup: document.getElementById('multiplicadorGroup'),
    viatico: document.getElementById('viatico'),
    estacionamiento: document.getElementById('estacionamiento'),
    valorCalculado: document.getElementById('valorCalculado'),
    valorCalculadoFormatted: document.getElementById('valorCalculadoFormatted'),
    descargarExcel: document.getElementById('descargarExcel'),
    descargarExcelBoleta: document.getElementById('descargarExcelBoleta'),
    cuerpoTablaTrabajos: document.getElementById('cuerpoTablaTrabajos')
};

// Variables globales
let clientesData = [];
let ciudadesData = [];

/**
 * Objeto para manejar las operaciones relacionadas con los trabajos
 */
const TrabajoManager = {
    /**
     * Carga y muestra la lista de trabajos del mes actual o del mes especificado
     * @param {number} [anio] - Año para filtrar los trabajos
     * @param {number} [mes] - Mes para filtrar los trabajos
     */
    async cargarTrabajos(anio, mes) {
        const fechaActual = new Date();
        anio = anio || fechaActual.getFullYear();
        mes = mes || fechaActual.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12

        try {
            const [clientesResponse, trabajosResponse] = await Promise.all([
                fetch('/api/clientes'),
                fetch(`/api/trabajos?anio=${anio}&mes=${mes}`)
            ]);
            clientesData = await clientesResponse.json();
            const trabajos = await trabajosResponse.json();
            this.renderizarTablaTrabajos(trabajos);
        } catch (error) {
            console.error('Error al cargar trabajos:', error);
            this.mostrarErrorCargaTrabajos();
        }
    },

    /**
     * Renderiza la tabla de trabajos
     * @param {Array} trabajos - Lista de trabajos a mostrar
     */
    renderizarTablaTrabajos(trabajos) {
        DOM.cuerpoTablaTrabajos.innerHTML = '';
        if (trabajos.length === 0) {
            DOM.cuerpoTablaTrabajos.innerHTML = '<tr><td colspan="10">No hay trabajos registrados.</td></tr>';
            return;
        }
        trabajos.forEach(trabajo => {
            const tr = document.createElement('tr');
            const cliente = clientesData.find(c => c.codigo === trabajo.codigoCliente);
            tr.innerHTML = `
                <td data-label="Fecha">${formatearFecha(trabajo.fecha)}</td>
                <td data-label="Código">${trabajo.codigo || 'N/A'}</td>
                <td data-label="Tipo">${trabajo.tipo}</td>
                <td data-label="Cliente">${trabajo.codigoCliente}</td>
                <td data-label="Ciudad">${cliente ? cliente.ciudad : 'N/A'}</td>
                <td data-label="Valor">${formatearValorMoneda(trabajo.valor)}</td>
                <td data-label="Viático">${formatearValorMoneda(trabajo.viatico)}</td>
                <td data-label="Estacionamiento">${formatearValorMoneda(trabajo.estacionamiento)}</td>
                <td data-label="Descripción">${trabajo.descripcion}</td>
                <td data-label="Acciones">
                    <button onclick="TrabajoManager.eliminarTrabajo('${trabajo._id}')">Eliminar</button>
                </td>
            `;
            DOM.cuerpoTablaTrabajos.appendChild(tr);
        });
    },

    /**
     * Muestra un mensaje de error en la tabla de trabajos
     */
    mostrarErrorCargaTrabajos() {
        DOM.cuerpoTablaTrabajos.innerHTML = '<tr><td colspan="10">Error al cargar los trabajos. Por favor, intente de nuevo.</td></tr>';
    },

    /**
     * Agrega un nuevo trabajo
     * @param {Event} event - Evento del formulario
     */
    async agregarTrabajo(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const trabajoData = Object.fromEntries(formData.entries());

        if (!trabajoData.codigoCliente) {
            alert('Por favor, seleccione un cliente.');
            return;
        }

        const cliente = clientesData.find(c => c.codigo === trabajoData.codigoCliente);
        if (cliente) {
            trabajoData.valor = trabajoData.tipoValor === 'mantenimiento'
                ? cliente.valorMantenimiento
                : cliente.valorIncidente * parseInt(trabajoData.multiplicador || 1);
            trabajoData.viatico = parseFloat(trabajoData.viatico) || 0;
            trabajoData.estacionamiento = parseFloat(trabajoData.estacionamiento) || 0;

            await this.actualizarCliente(cliente);
        } else {
            alert('Cliente no encontrado. Por favor, seleccione un cliente válido.');
            return;
        }

        trabajoData.valor = Number(trabajoData.valor) || 0;
        trabajoData.tipo = trabajoData.tipoValor === 'mantenimiento' ? 'Mantenimiento' : 'Incidente';

        delete trabajoData.tipoValor;
        delete trabajoData.multiplicador;
        delete trabajoData.valorCalculado;

        try {
            const response = await fetch('/api/trabajos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trabajoData),
            });

            if (!response.ok) {
                throw new Error(`Error al agregar el trabajo: ${await response.text()}`);
            }

            const data = await response.json();
            console.log('Trabajo agregado:', data);
            this.cargarTrabajos();
            event.target.reset();
            this.limpiarCamposCalculados();
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al agregar el trabajo o actualizar el cliente. Por favor, intente de nuevo.');
        }
    },

    /**
     * Actualiza los datos del cliente en el servidor
     * @param {Object} cliente - Datos del cliente a actualizar
     */
    async actualizarCliente(cliente) {
        try {
            const response = await fetch(`/api/clientes/${cliente._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    viatico: cliente.viatico,
                    estacionamiento: cliente.estacionamiento
                }),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el cliente');
            }

            return await response.json();
        } catch (error) {
            console.error('Error al actualizar el cliente:', error);
            throw error;
        }
    },

    /**
     * Elimina un trabajo específico
     * @param {string} id - ID del trabajo a eliminar
     */
    async eliminarTrabajo(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
            try {
                const response = await fetch(`/api/trabajos/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Trabajo eliminado:', data);
                this.cargarTrabajos();
            } catch (error) {
                console.error('Error al eliminar el trabajo:', error);
                alert('No se pudo eliminar el trabajo. Por favor, intente de nuevo.');
            }
        }
    },

    /**
     * Limpia los campos calculados del formulario
     */
    limpiarCamposCalculados() {
        ['valorCalculado', 'viatico', 'estacionamiento'].forEach(campo => {
            document.getElementById(campo).value = '';
            const formatted = document.getElementById(campo + 'Formatted');
            if (formatted) formatted.textContent = '';
        });
        DOM.multiplicadorGroup.style.display = 'none';
    }
};

/**
 * Objeto para manejar las operaciones relacionadas con los clientes
 */
const ClienteManager = {
    /**
     * Carga la lista de ciudades en el selector correspondiente
     */
    async cargarCiudades() {
        try {
            const response = await fetch('/api/ciudades');
            ciudadesData = await response.json();
            DOM.ciudad.innerHTML = '<option value="">Seleccione una ciudad</option>';
            ciudadesData.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad;
                option.textContent = ciudad;
                DOM.ciudad.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar las ciudades:', error);
        }
    },

    /**
     * Carga la lista de clientes correspondiente a la ciudad seleccionada
     */
    async cargarClientesPorCiudad() {
        const ciudadSeleccionada = DOM.ciudad.value;
        DOM.codigoCliente.innerHTML = '<option value="">Seleccione un cliente</option>';

        if (!ciudadSeleccionada) return;

        try {
            const response = await fetch(`/api/clientes?ciudad=${encodeURIComponent(ciudadSeleccionada)}`);
            if (!response.ok) {
                throw new Error('Error al cargar los clientes');
            }
            clientesData = await response.json();
            clientesData.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.codigo;
                option.textContent = `${cliente.codigo} - ${cliente.cliente}`;
                DOM.codigoCliente.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar los clientes:', error);
            alert('Hubo un error al cargar los clientes. Por favor, intente de nuevo.');
        }
    },

    /**
     * Actualiza los valores de viático y estacionamiento según el cliente seleccionado
     */
    actualizarValoresCliente() {
        const codigoCliente = DOM.codigoCliente.value;
        const cliente = clientesData.find(c => c.codigo === codigoCliente);

        if (cliente) {
            DOM.viatico.value = cliente.viatico;
            DOM.estacionamiento.value = cliente.estacionamiento;
            ['viatico', 'estacionamiento'].forEach(campo => {
                actualizarValorFormateado({ target: document.getElementById(campo) });
            });
            actualizarValorCalculado();
        } else {
            TrabajoManager.limpiarCamposCalculados();
        }
    }
};

/**
 * Objeto para manejar las operaciones de filtrado y descarga
 */
const FiltroManager = {
    /**
     * Filtra los trabajos por mes
     * @param {Event} event - Evento del formulario de filtro
     */
    async filtrarTrabajos(event) {
        event.preventDefault();
        const mesSeleccionado = document.getElementById('mes').value;

        if (!mesSeleccionado) {
            alert('Por favor, seleccione un mes para filtrar.');
            return;
        }

        const [anio, mes] = mesSeleccionado.split('-');
        await TrabajoManager.cargarTrabajos(anio, mes);
    },

   /**
     * Descarga un archivo Excel con los trabajos del mes seleccionado
     * @param {string} tipo - Tipo de Excel a descargar ('normal' o 'boleta')
     */
   async descargarExcel(tipo = 'normal') {
    const mesSeleccionado = document.getElementById('mes').value;

    if (!mesSeleccionado) {
        alert('Por favor, seleccione un mes para descargar.');
        return;
    }

    const [anio, mes] = mesSeleccionado.split('-');
    const apiUrl = tipo === 'boleta' 
        ? `/api/trabajos/excel-boleta?anio=${anio}&mes=${mes}`
        : `/api/trabajos/excel?anio=${anio}&mes=${mes}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Error al descargar el archivo Excel');
        }
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = tipo === 'boleta' 
            ? `boletas-${anio}-${mes}.xlsx`
            : `trabajos-${anio}-${mes}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al descargar el archivo Excel. Por favor, intente de nuevo.');
    }
}
};

/**
 * Actualiza el valor formateado para viático y estacionamiento
 * @param {Event} event - Evento de input
 */
function actualizarValorFormateado(event) {
    const campo = event.target;
    const valor = parseFloat(campo.value) || 0;
    const valorFormateado = document.getElementById(`${campo.id}Formatted`);
    valorFormateado.textContent = formatearValorMoneda(valor);
}

/**
 * Maneja el cambio en el tipo de valor (mantenimiento o incidente)
 */
function manejarCambioTipoValor() {
    const tipoValor = DOM.tipoValor.value;
    DOM.multiplicadorGroup.style.display = tipoValor === 'incidente' ? 'block' : 'none';
    DOM.multiplicador.value = tipoValor === 'incidente' ? '' : '1';
    actualizarValorCalculado();
}

/**
 * Actualiza el valor calculado basado en el tipo de valor y el multiplicador
 */
function actualizarValorCalculado() {
    const codigoCliente = DOM.codigoCliente.value;
    const tipoValor = DOM.tipoValor.value;
    const multiplicador = parseInt(DOM.multiplicador.value) || 1;

    const cliente = clientesData.find(c => c.codigo === codigoCliente);
    if (!cliente) return;

    let valor = tipoValor === 'mantenimiento' ? cliente.valorMantenimiento : cliente.valorIncidente * multiplicador;

    DOM.valorCalculado.value = valor;
    DOM.valorCalculadoFormatted.textContent = formatearValorMoneda(valor);
}

/**
 * Formatea una fecha de YYYY-MM-DD a DD/MM/YYYY
 * @param {string} fechaString - Fecha en formato YYYY-MM-DD
 * @return {string} Fecha formateada como DD/MM/YYYY
 */
function formatearFecha(fechaString) {
    const [anio, mes, dia] = fechaString.split('-');
    return `${dia}/${mes}/${anio}`;
}

/**
 * Formatea un valor numérico a formato de moneda chilena
 * @param {number} valor - Valor a formatear
 * @return {string} Valor formateado como moneda chilena
 */
function formatearValorMoneda(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
}

/**
 * Inicializa la página cuando el DOM está completamente cargado
 */
function initializePage() {
    const fechaActual = new Date();
    const mesActual = fechaActual.toISOString().slice(0, 7); // Formato YYYY-MM
    document.getElementById('mes').value = mesActual;

    TrabajoManager.cargarTrabajos(); // Cargará los trabajos del mes actual por defecto
    ClienteManager.cargarCiudades();
   
    // Configurar event listeners para elementos del DOM
    DOM.formularioTrabajo.addEventListener('submit', TrabajoManager.agregarTrabajo.bind(TrabajoManager));
    DOM.formularioFiltro.addEventListener('submit', FiltroManager.filtrarTrabajos);
    DOM.ciudad.addEventListener('change', ClienteManager.cargarClientesPorCiudad);
    DOM.codigoCliente.addEventListener('change', ClienteManager.actualizarValoresCliente);
    DOM.tipoValor.addEventListener('change', manejarCambioTipoValor);
    DOM.multiplicador.addEventListener('input', actualizarValorCalculado);
    DOM.viatico.addEventListener('input', actualizarValorFormateado);
    DOM.estacionamiento.addEventListener('input', actualizarValorFormateado);
    DOM.descargarExcel.addEventListener('click', () => FiltroManager.descargarExcel('normal'));
    DOM.descargarExcelBoleta.addEventListener('click', () => FiltroManager.descargarExcel('boleta'));
}

// Inicializar la página cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initializePage);