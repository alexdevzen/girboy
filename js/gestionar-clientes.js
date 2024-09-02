document.addEventListener('DOMContentLoaded', function () {
    cargarClientes();
    document.getElementById('formularioCliente').addEventListener('submit', agregarCliente);
    document.getElementById('formularioEditarCliente').addEventListener('submit', actualizarCliente);
    document.getElementById('cerrarModal').addEventListener('click', cerrarModalEdicion);

    // Event listeners para formateo en tiempo real
    ['valorMantenimiento', 'valorIncidente', 'viatico', 'estacionamiento'].forEach(campo => {
        document.getElementById(campo).addEventListener('input', actualizarValorFormateado);
        document.getElementById('edit' + campo.charAt(0).toUpperCase() + campo.slice(1)).addEventListener('input', actualizarValorFormateado);
    });
});

function formatearValorMoneda(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
}

function actualizarValorFormateado(event) {
    const campo = event.target;
    const valor = parseFloat(campo.value) || 0;
    const valorFormateado = document.getElementById(campo.id + 'Formatted');
    valorFormateado.textContent = formatearValorMoneda(valor);
}

function cargarClientes() {
    fetch('/api/clientes')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar los clientes');
            return response.json();
        })
        .then(clientes => {
            const tbody = document.getElementById('cuerpoTablaClientes');
            tbody.innerHTML = '';
            clientes.forEach(cliente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Código">${cliente.codigo}</td>
                    <td data-label="Cliente">${cliente.cliente}</td>
                    <td data-label="Dirección">${cliente.direccion}</td>
                    <td data-label="Ciudad">${cliente.ciudad}</td>
                    <td data-label="Valor Mantenimiento">${formatearValorMoneda(cliente.valorMantenimiento)}</td>
                    <td data-label="Valor Incidente">${formatearValorMoneda(cliente.valorIncidente)}</td>
                    <td data-label="Viático">${formatearValorMoneda(cliente.viatico)}</td>
                    <td data-label="Estacionamiento">${formatearValorMoneda(cliente.estacionamiento)}</td>
                    <td data-label="Acciones">
                        <button onclick="editarCliente('${cliente._id}')" class="btn-editar">Editar</button>
                        <button onclick="eliminarCliente('${cliente._id}')" class="btn-eliminar">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ocurrió un error al cargar los clientes. Por favor, recargue la página.');
        });
}

function agregarCliente(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const clienteData = Object.fromEntries(formData.entries());

    if (!validarDatosCliente(clienteData)) {
        alert('Por favor, complete todos los campos requeridos.');
        return;
    }

    // Convertir valores monetarios a números
    ['valorMantenimiento', 'valorIncidente', 'viatico', 'estacionamiento'].forEach(campo => {
        clienteData[campo] = parseFloat(clienteData[campo]) || 0;
    });

    fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al agregar el cliente');
        return response.json();
    })
    .then(data => {
        console.log('Cliente agregado:', data);
        cargarClientes();
        resetearFormulario(event.target);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al agregar el cliente. Por favor, intente de nuevo.');
    });
}

function editarCliente(id) {
    fetch(`/api/clientes/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar los datos del cliente');
            return response.json();
        })
        .then(cliente => {
            if (!cliente) throw new Error('Cliente no encontrado');
            
            document.getElementById('editId').value = cliente._id;
            document.getElementById('editCodigo').value = cliente.codigo;
            document.getElementById('editCliente').value = cliente.cliente;
            document.getElementById('editDireccion').value = cliente.direccion;
            document.getElementById('editCiudad').value = cliente.ciudad;
            document.getElementById('editValorMantenimiento').value = cliente.valorMantenimiento;
            document.getElementById('editValorIncidente').value = cliente.valorIncidente;
            document.getElementById('editViatico').value = cliente.viatico;
            document.getElementById('editEstacionamiento').value = cliente.estacionamiento;
            
            ['ValorMantenimiento', 'ValorIncidente', 'Viatico', 'Estacionamiento'].forEach(campo => {
                actualizarValorFormateado({ target: document.getElementById('edit' + campo) });
            });

            document.getElementById('modalEditarCliente').showModal();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('No se pudo cargar la información del cliente. Por favor, intente de nuevo.');
        });
}

function actualizarCliente(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const clienteData = Object.fromEntries(formData.entries());
    const id = clienteData.id;
    delete clienteData.id;

    if (!validarDatosCliente(clienteData)) {
        alert('Por favor, complete todos los campos requeridos.');
        return;
    }

    // Convertir valores monetarios a números
    ['valorMantenimiento', 'valorIncidente', 'viatico', 'estacionamiento'].forEach(campo => {
        clienteData[campo] = parseFloat(clienteData[campo]) || 0;
    });

    fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al actualizar el cliente');
        return response.json();
    })
    .then(data => {
        console.log('Cliente actualizado:', data);
        cargarClientes();
        cerrarModalEdicion();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al actualizar el cliente. Por favor, intente de nuevo.');
    });
}

function eliminarCliente(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
        fetch(`/api/clientes/${id}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Error al eliminar el cliente');
                return response.json();
            })
            .then(data => {
                console.log('Cliente eliminado:', data);
                cargarClientes();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('No se pudo eliminar el cliente. Por favor, intente de nuevo.');
            });
    }
}

function cerrarModalEdicion() {
    document.getElementById('modalEditarCliente').close();
}

function limpiarCamposFormateados() {
    ['valorMantenimiento', 'valorIncidente', 'viatico', 'estacionamiento'].forEach(campo => {
        document.getElementById(campo + 'Formatted').textContent = '';
    });
}

function resetearFormulario(formulario) {
    formulario.reset();
    limpiarCamposFormateados();
}

function validarDatosCliente(clienteData) {
    const camposRequeridos = ['codigo', 'cliente', 'direccion', 'ciudad'];
    return camposRequeridos.every(campo => clienteData[campo] && clienteData[campo].trim() !== '');
}