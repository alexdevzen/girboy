document.addEventListener('DOMContentLoaded', function () {
    cargarTrabajos();
    cargarCiudades();
    document.getElementById('formularioTrabajo').addEventListener('submit', agregarTrabajo);
    
    // Eventos para actualizar valores
    document.getElementById('ciudad').addEventListener('change', function() {
        cargarClientesPorCiudad();
        // Resetear la selección del cliente
        document.getElementById('codigoCliente').value = '';
        // Limpiar los campos relacionados con el cliente
        document.getElementById('viatico').value = '';
        document.getElementById('estacionamiento').value = '';
        document.getElementById('valorCalculado').value = '';
    });
    document.getElementById('codigoCliente').addEventListener('change', actualizarValoresCliente);
    document.getElementById('tipoValor').addEventListener('change', actualizarValorCalculado);
    document.getElementById('multiplicador').addEventListener('input', actualizarValorCalculado);

    // Mostrar/ocultar el campo multiplicador
    document.getElementById('tipoValor').addEventListener('change', function() {
        const multiplicadorGroup = document.getElementById('multiplicadorGroup');
        multiplicadorGroup.style.display = this.value === 'incidente' ? 'block' : 'none';
        if (this.value !== 'incidente') {
            document.getElementById('multiplicador').value = 1;
        }
    });
});

let clientesData = [];
let ciudadesData = [];


function cargarCiudades() {
    fetch('/api/ciudades')
        .then(response => response.json())
        .then(ciudades => {
            ciudadesData = ciudades;
            const selectCiudad = document.getElementById('ciudad');
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
    fetch(`/api/clientes${ciudadSeleccionada ? `?ciudad=${encodeURIComponent(ciudadSeleccionada)}` : ''}`)
        .then(response => response.json())
        .then(clientes => {
            clientesData = clientes;
            const selectCliente = document.getElementById('codigoCliente');
            selectCliente.innerHTML = '<option value="">Seleccione un cliente</option>';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.codigo;
                option.textContent = `${cliente.codigo} - ${cliente.cliente}`;
                selectCliente.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar los clientes:', error));
}


function cargarCodigosClientes() {
    fetch('/api/clientes')
        .then(response => response.json())
        .then(clientes => {
            clientesData = clientes;
            const select = document.getElementById('codigoCliente');
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente.codigo;
                option.textContent = `${cliente.codigo} - ${cliente.cliente}`;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar los códigos de clientes:', error));
}

function actualizarValoresCliente() {
    const codigoCliente = document.getElementById('codigoCliente').value;
    const cliente = clientesData.find(c => c.codigo === codigoCliente);
    if (cliente) {
        document.getElementById('viatico').value = cliente.viatico.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
        document.getElementById('estacionamiento').value = cliente.estacionamiento;
        actualizarValorCalculado();
    } else {
        document.getElementById('viatico').value = '';
        document.getElementById('estacionamiento').value = '';
        document.getElementById('valorCalculado').value = '';
    }
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

    document.getElementById('valorCalculado').value = valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

function cargarTrabajos() {
// Primero, cargar todos los clientes
fetch('/api/clientes')
.then(response => response.json())
.then(clientes => {
    clientesData = clientes;

// Ahora cargar los trabajos
    return fetch('/api/trabajos');
})
        .then(response => response.json())
        .then(trabajos => {
            const tbody = document.getElementById('cuerpoTablaTrabajos');
            tbody.innerHTML = '';
            trabajos.forEach(trabajo => {
                const tr = document.createElement('tr');
                const valorFormateado = trabajo.valor !== undefined && !isNaN(trabajo.valor)
                    ? trabajo.valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })
                    : 'N/A';
                const viaticoFormateado = trabajo.viatico !== undefined && !isNaN(trabajo.viatico)
                    ? trabajo.viatico.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })
                    : 'N/A';
                const estacionamientoFormateado = trabajo.estacionamiento !== undefined && !isNaN(trabajo.estacionamiento)
                    ? trabajo.estacionamiento.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })
                    : 'N/A';
                
                // Obtener la ciudad del cliente
                const cliente = clientesData.find(c => c.codigo === trabajo.codigoCliente);
                const ciudadCliente = cliente ? cliente.ciudad : 'N/A';

                tr.innerHTML = `
                    <td data-label="Fecha">${trabajo.fecha}</td>
                    <td data-label="Código">${trabajo.codigo || 'N/A'}</td>
                    <td data-label="Tipo">${trabajo.tipo}</td>
                    <td data-label="Cliente">${trabajo.codigoCliente}</td>
                    <td data-label="Ciudad">${ciudadCliente}</td>
                    <td data-label="Valor">${valorFormateado}</td>
                    <td data-label="Viático">${viaticoFormateado}</td>
                    <td data-label="Estacionamiento">${estacionamientoFormateado}</td>
                    <td data-label="Descripción">${trabajo.descripcion}</td>
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

    if (!trabajoData.codigo) {
        delete trabajoData.codigo;
    }

    const cliente = clientesData.find(c => c.codigo === trabajoData.codigoCliente);
    if (cliente) {
        trabajoData.valor = trabajoData.tipoValor === 'mantenimiento' 
            ? cliente.valorMantenimiento 
            : cliente.valorIncidente * parseInt(trabajoData.multiplicador || 1);
        trabajoData.viatico = cliente.viatico;
        // El estacionamiento se toma del campo editable, no del cliente
    } else {
        trabajoData.valor = 0;
        trabajoData.viatico = 0;
    }

    trabajoData.valor = Number(trabajoData.valor) || 0;
    trabajoData.viatico = Number(trabajoData.viatico) || 0;
    trabajoData.estacionamiento = Number(trabajoData.estacionamiento) || 0;

    delete trabajoData.tipoValor;
    delete trabajoData.multiplicador;
    delete trabajoData.valorCalculado;

    fetch('/api/trabajos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(trabajoData),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Trabajo agregado:', data);
            cargarTrabajos();
            event.target.reset();
            document.getElementById('valorCalculado').value = '';
            document.getElementById('viatico').value = '';
            document.getElementById('estacionamiento').value = '';
            document.getElementById('multiplicadorGroup').style.display = 'none';
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}