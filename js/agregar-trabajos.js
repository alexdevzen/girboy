function initializePage() {
    cargarTrabajos();
    cargarCiudades();

    const formularioTrabajo = document.getElementById('formularioTrabajo');
    const formularioFiltro = document.getElementById('formularioFiltro');
    const ciudadSelect = document.getElementById('ciudad');
    const codigoClienteSelect = document.getElementById('codigoCliente');
    const tipoValorSelect = document.getElementById('tipoValor');
    const multiplicadorInput = document.getElementById('multiplicador');

    if (formularioTrabajo) {
        formularioTrabajo.addEventListener('submit', agregarTrabajo);
    }
    if (formularioFiltro) {
        formularioFiltro.addEventListener('submit', filtrarTrabajos);
    }
    if (ciudadSelect) {
        ciudadSelect.addEventListener('change', cargarClientesPorCiudad);
    }
    if (codigoClienteSelect) {
        codigoClienteSelect.addEventListener('change', actualizarValoresCliente);
    }
    if (tipoValorSelect) {
        tipoValorSelect.addEventListener('change', manejarCambioTipoValor);
    }
    if (multiplicadorInput) {
        multiplicadorInput.addEventListener('input', actualizarValorCalculado);
    }
}

let clientesData = [];
let ciudadesData = [];

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

function actualizarValoresCliente() {
    const codigoCliente = document.getElementById('codigoCliente').value;
    const cliente = clientesData.find(c => c.codigo === codigoCliente);

    // Actualiza los valores si el cliente existe
    if (cliente) {
        document.getElementById('viatico').value = cliente.viatico;
        const viaticoFormatted = document.getElementById('viaticoFormatted');
        if (viaticoFormatted) {
            viaticoFormatted.textContent = formatearValorMoneda(cliente.viatico);
        }
        document.getElementById('estacionamiento').value = cliente.estacionamiento;
        const estacionamientoFormatted = document.getElementById('estacionamientoFormatted');
        if (estacionamientoFormatted) {
            estacionamientoFormatted.textContent = formatearValorMoneda(cliente.estacionamiento);
        }
        actualizarValorCalculado();
    } else {
        limpiarCamposCalculados();
    }
}


function manejarCambioTipoValor() {
    const tipoValor = document.getElementById('tipoValor').value;
    const multiplicadorGroup = document.getElementById('multiplicadorGroup');
    multiplicadorGroup.style.display = tipoValor === 'incidente' ? 'block' : 'none';
    document.getElementById('multiplicador').value = tipoValor === 'incidente' ? '' : '1';
    actualizarValorCalculado();
}

function actualizarValorCalculado() {
    const codigoCliente = document.getElementById('codigoCliente').value;
    const tipoValor = document.getElementById('tipoValor').value;
    const multiplicador = parseInt(document.getElementById('multiplicador').value) || 1;

    const cliente = clientesData.find(c => c.codigo === codigoCliente);
    if (!cliente) return;

    let valor = 0;
    if (tipoValor === 'mantenimiento') {
        valor = cliente.valorMantenimiento;
    } else if (tipoValor === 'incidente') {
        valor = cliente.valorIncidente * multiplicador;
    }

    // Actualiza el valor calculado
    const valorCalculado = document.getElementById('valorCalculado');
    if (valorCalculado) {
        valorCalculado.value = valor;
        const valorCalculadoFormatted = document.getElementById('valorCalculadoFormatted');
        if (valorCalculadoFormatted) {
            valorCalculadoFormatted.textContent = formatearValorMoneda(valor);
        }
    }
}


function cargarTrabajos() {
    Promise.all([
        fetch('/api/clientes').then(response => response.json()),
        fetch('/api/trabajos').then(response => response.json())
    ])
        .then(([clientes, trabajos]) => {
            clientesData = clientes;
            const tbody = document.getElementById('cuerpoTablaTrabajos');
            tbody.innerHTML = '';
            trabajos.forEach(trabajo => {
                const tr = document.createElement('tr');
                const cliente = clientesData.find(c => c.codigo === trabajo.codigoCliente);
                tr.innerHTML = `
                <td data-label="Fecha">${trabajo.fecha}</td>
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
        .catch(error => console.error('Error:', error));
}

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
        trabajoData.viatico = cliente.viatico;
        trabajoData.estacionamiento = cliente.estacionamiento;
    } else {
        alert('Cliente no encontrado. Por favor, seleccione un cliente válido.');
        return;
    }

    trabajoData.valor = Number(trabajoData.valor) || 0;
    trabajoData.viatico = Number(trabajoData.viatico) || 0;
    trabajoData.estacionamiento = Number(trabajoData.estacionamiento) || 0;

    trabajoData.tipo = trabajoData.tipoValor === 'mantenimiento' ? 'Mantenimiento' : 'Incidente';

    delete trabajoData.tipoValor;
    delete trabajoData.multiplicador;
    delete trabajoData.valorCalculado;

    console.log('Datos finales a enviar:', JSON.stringify(trabajoData));

    fetch('/api/trabajos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trabajoData),
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
            alert('Ocurrió un error al agregar el trabajo. Por favor, intente de nuevo.');
        });
}


function limpiarCamposCalculados() {
    ['valorCalculado', 'viatico', 'estacionamiento'].forEach(campo => {
        document.getElementById(campo).value = '';
        const formatted = document.getElementById(campo + 'Formatted');
        if (formatted) formatted.textContent = '';
    });
    document.getElementById('multiplicadorGroup').style.display = 'none';
}

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
                    <td data-label="Fecha">${trabajo.fecha}</td>
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

function formatearValorMoneda(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
}

document.addEventListener('DOMContentLoaded', initializePage);