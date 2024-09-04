// Variables globales para almacenar datos de clientes y ciudades
let clientesData = [];
let ciudadesData = [];

/**
 * Inicializa la página cargando datos y configurando event listeners
 */
function initializePage() {
    cargarTrabajos();
    cargarCiudades();
   
    // Configurar event listeners para elementos del DOM
    const elementos = {
        'formularioTrabajo': ['submit', agregarTrabajo],
        'formularioFiltro': ['submit', filtrarTrabajos],
        'ciudad': ['change', cargarClientesPorCiudad],
        'codigoCliente': ['change', actualizarValoresCliente],
        'tipoValor': ['change', manejarCambioTipoValor],
        'multiplicador': ['input', actualizarValorCalculado],
        'viatico': ['input', actualizarValorFormateado],
        'estacionamiento': ['input', actualizarValorFormateado],
        'descargarExcel': ['click', descargarExcel]
    };

    for (const [id, [evento, handler]] of Object.entries(elementos)) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.addEventListener(evento, handler);
    }
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
 * Carga y muestra la lista de trabajos
 */
function cargarTrabajos() {
    Promise.all([
        fetch('/api/clientes').then(response => response.json()),
        fetch('/api/trabajos').then(response => response.json())
    ])
        .then(([clientes, trabajos]) => {
            clientesData = clientes;
            const tbody = document.getElementById('cuerpoTablaTrabajos');
            tbody.innerHTML = '';
            if (trabajos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10">No hay trabajos registrados.</td></tr>';
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
                    <button onclick="eliminarTrabajo('${trabajo._id}')">Eliminar</button>
                </td>
            `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error al cargar trabajos:', error);
            const tbody = document.getElementById('cuerpoTablaTrabajos');
            tbody.innerHTML = '<tr><td colspan="10">Error al cargar los trabajos. Por favor, intente de nuevo.</td></tr>';
        });
}

/**
 * Carga la lista de ciudades en el selector correspondiente
 */
function cargarCiudades() {
    fetch('/api/ciudades')
        .then(response => response.json())
        .then(ciudades => {
            ciudadesData = ciudades;
            const selectCiudad = document.getElementById('ciudad');
            selectCiudad.innerHTML = '<option value="">Seleccione una ciudad</option>';
            ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad;
                option.textContent = ciudad;
                selectCiudad.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar las ciudades:', error));
}

/**
 * Carga la lista de clientes correspondiente a la ciudad seleccionada
 */
function cargarClientesPorCiudad() {
    const ciudadSeleccionada = document.getElementById('ciudad').value;
    const selectCliente = document.getElementById('codigoCliente');

    if (!selectCliente) {
        console.error('Elemento codigoCliente no encontrado');
        return;
    }

    if (!ciudadSeleccionada) {
        selectCliente.innerHTML = '<option value="">Seleccione un cliente</option>';
        return;
    }

    fetch(`/api/clientes?ciudad=${encodeURIComponent(ciudadSeleccionada)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los clientes');
            }
            return response.json();
        })
        .then(clientes => {
            clientesData = clientes;
            selectCliente.innerHTML = '<option value="">Seleccione un cliente</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.codigo;
                option.textContent = `${cliente.codigo} - ${cliente.cliente}`;
                selectCliente.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error al cargar los clientes:', error);
            alert('Hubo un error al cargar los clientes. Por favor, intente de nuevo.');
        });
}

/**
 * Actualiza los valores de viático y estacionamiento según el cliente seleccionado
 */
function actualizarValoresCliente() {
    const codigoCliente = document.getElementById('codigoCliente').value;
    const cliente = clientesData.find(c => c.codigo === codigoCliente);

    if (cliente) {
        document.getElementById('viatico').value = cliente.viatico;
        document.getElementById('estacionamiento').value = cliente.estacionamiento;
        ['viatico', 'estacionamiento'].forEach(campo => {
            actualizarValorFormateado({ target: document.getElementById(campo) });
        });
        actualizarValorCalculado();
    } else {
        limpiarCamposCalculados();
    }
}

/**
 * Actualiza el valor formateado para viático y estacionamiento
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
    const tipoValor = document.getElementById('tipoValor').value;
    const multiplicadorGroup = document.getElementById('multiplicadorGroup');
    multiplicadorGroup.style.display = tipoValor === 'incidente' ? 'block' : 'none';
    document.getElementById('multiplicador').value = tipoValor === 'incidente' ? '' : '1';
    actualizarValorCalculado();
}

/**
 * Actualiza el valor calculado basado en el tipo de valor y el multiplicador
 */
function actualizarValorCalculado() {
    const codigoCliente = document.getElementById('codigoCliente').value;
    const tipoValor = document.getElementById('tipoValor').value;
    const multiplicador = parseInt(document.getElementById('multiplicador').value) || 1;

    const cliente = clientesData.find(c => c.codigo === codigoCliente);
    if (!cliente) return;

    let valor = tipoValor === 'mantenimiento' ? cliente.valorMantenimiento : cliente.valorIncidente * multiplicador;

    const valorCalculado = document.getElementById('valorCalculado');
    if (valorCalculado) {
        valorCalculado.value = valor;
        const valorCalculadoFormatted = document.getElementById('valorCalculadoFormatted');
        if (valorCalculadoFormatted) {
            valorCalculadoFormatted.textContent = formatearValorMoneda(valor);
        }
    }
}

/**
 * Agrega un nuevo trabajo y actualiza los valores del cliente
 * @param {Event} event - Evento del formulario
 */
function agregarTrabajo(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const trabajoData = Object.fromEntries(formData.entries());

    console.log('Datos del formulario:', trabajoData);

    if (!trabajoData.codigo) {
        delete trabajoData.codigo;
    }

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

        // Actualizar los valores del cliente
        cliente.viatico = trabajoData.viatico;
        cliente.estacionamiento = trabajoData.estacionamiento;
    } else {
        alert('Cliente no encontrado. Por favor, seleccione un cliente válido.');
        return;
    }

    trabajoData.valor = Number(trabajoData.valor) || 0;
    trabajoData.tipo = trabajoData.tipoValor === 'mantenimiento' ? 'Mantenimiento' : 'Incidente';

    delete trabajoData.tipoValor;
    delete trabajoData.multiplicador;
    delete trabajoData.valorCalculado;

    console.log('Datos finales a enviar:', JSON.stringify(trabajoData));

    // Primero, actualizar el cliente
    actualizarCliente(cliente)
        .then(() => {
            // Luego, agregar el trabajo
            return fetch('/api/trabajos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trabajoData),
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Error al agregar el trabajo: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Trabajo agregado:', data);
            cargarTrabajos();
            event.target.reset();
            limpiarCamposCalculados();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocurrió un error al agregar el trabajo o actualizar el cliente. Por favor, intente de nuevo.');
        });
}

/**
 * Actualiza los datos del cliente en el servidor
 * @param {Object} cliente - Datos del cliente a actualizar
 * @return {Promise} Promesa que resuelve cuando se completa la actualización
 */
function actualizarCliente(cliente) {
    return fetch(`/api/clientes/${cliente._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            viatico: cliente.viatico,
            estacionamiento: cliente.estacionamiento
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al actualizar el cliente');
        }
        return response.json();
    });
}

/**
 * Limpia los campos calculados del formulario
 */
function limpiarCamposCalculados() {
    ['valorCalculado', 'viatico', 'estacionamiento'].forEach(campo => {
        document.getElementById(campo).value = '';
        const formatted = document.getElementById(campo + 'Formatted');
        if (formatted) formatted.textContent = '';
    });
    document.getElementById('multiplicadorGroup').style.display = 'none';
}

/**
 * Elimina un trabajo específico
 * @param {string} id - ID del trabajo a eliminar
 */
function eliminarTrabajo(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este trabajo?')) {
        fetch(`/api/trabajos/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Trabajo eliminado:', data);
                cargarTrabajos();
            })
            .catch(error => {
                console.error('Error al eliminar el trabajo:', error);
                alert('No se pudo eliminar el trabajo. Por favor, intente de nuevo.');
            });
    }
}

/**
 * Filtra los trabajos por mes
 * @param {Event} event - Evento del formulario de filtro
 */
function filtrarTrabajos(event) {
    event.preventDefault();
    const mesSeleccionado = document.getElementById('mes').value;

    if (!mesSeleccionado) {
        alert('Por favor, seleccione un mes para filtrar.');
        return;
    }

    const [anio, mes] = mesSeleccionado.split('-');

    fetch(`/api/trabajos?anio=${anio}&mes=${mes}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(trabajos => {
            const tbody = document.getElementById('cuerpoTablaTrabajos');
            tbody.innerHTML = '';

            if (trabajos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10">No se encontraron trabajos para el mes seleccionado.</td></tr>';
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
                        <button onclick="eliminarTrabajo('${trabajo._id}')">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error al filtrar trabajos:', error);
            alert('Hubo un error al filtrar los trabajos. Por favor, intente de nuevo.');
        });
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
 * Descarga un archivo Excel con los trabajos del mes seleccionado
 */
function descargarExcel() {
    const mesSeleccionado = document.getElementById('mes').value;

    if (!mesSeleccionado) {
        alert('Por favor, seleccione un mes para descargar.');
        return;
    }

    const [anio, mes] = mesSeleccionado.split('-');
    const url = `/api/trabajos/excel?anio=${anio}&mes=${mes}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al descargar el archivo Excel');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `trabajos-${anio}-${mes}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocurrió un error al descargar el archivo Excel. Por favor, intente de nuevo.');
        });
}


// Agregar el nuevo botón al HTML
document.addEventListener('DOMContentLoaded', function() {
    const excelButton = document.getElementById('descargarExcel');
    const newButton = document.createElement('button');
    newButton.id = 'descargarExcelBoleta';
    newButton.textContent = 'Excel formato boleta';
    newButton.style.marginLeft = '10px';
    excelButton.parentNode.insertBefore(newButton, excelButton.nextSibling);
    newButton.addEventListener('click', descargarExcelBoleta);
});

// Función para descargar Excel en formato boleta
function descargarExcelBoleta() {
    const mesSeleccionado = document.getElementById('mes').value;

    if (!mesSeleccionado) {
        alert('Por favor, seleccione un mes para descargar.');
        return;
    }

    const [anio, mes] = mesSeleccionado.split('-');
    const url = `/api/trabajos/excel-boleta?anio=${anio}&mes=${mes}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al descargar el archivo Excel');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `boletas-${anio}-${mes}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocurrió un error al descargar el archivo Excel. Por favor, intente de nuevo.');
        });
}


// Inicializar la página cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initializePage);