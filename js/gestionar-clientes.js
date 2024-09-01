document.addEventListener('DOMContentLoaded', function () {
    cargarClientes();
    document.getElementById('formularioCliente').addEventListener('submit', agregarCliente);
    document.getElementById('formularioEditarCliente').addEventListener('submit', actualizarCliente);
    document.getElementById('cerrarModal').addEventListener('click', () => {
        document.getElementById('modalEditarCliente').close();
    });

    // Agregar event listeners para actualizar los valores formateados
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
    const valorFormateado = document.getElementById(campo.id + 'Formatted');
    valorFormateado.textContent = formatearValorMoneda(campo.value);
}

function cargarClientes() {
    fetch('/api/clientes')
        .then(response => response.json())
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
                        <button onclick="editarCliente('${cliente._id}')">Editar</button>
                        <button onclick="eliminarCliente('${cliente._id}')">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error:', error));
}

function agregarCliente(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const clienteData = Object.fromEntries(formData.entries());

    // Asegurarse de que los valores monetarios sean números
    ['valorMantenimiento', 'valorIncidente', 'viatico', 'estacionamiento'].forEach(campo => {
        clienteData[campo] = parseInt(clienteData[campo], 10);
    });

    fetch('/api/clientes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Cliente agregado:', data);
            cargarClientes();
            event.target.reset();
            // Limpiar los valores formateados
            ['valorMantenimiento', 'valorIncidente', 'viatico', 'estacionamiento'].forEach(campo => {
                document.getElementById(campo + 'Formatted').textContent = '';
            });
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function editarCliente(id) {
    fetch(`/api/clientes/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(cliente => {
            document.getElementById('editId').value = cliente._id;
            document.getElementById('editCodigo').value = cliente.codigo;
            document.getElementById('editCliente').value = cliente.cliente;
            document.getElementById('editDireccion').value = cliente.direccion;
            document.getElementById('editCiudad').value = cliente.ciudad;
            document.getElementById('editValorMantenimiento').value = cliente.valorMantenimiento;
            document.getElementById('editValorIncidente').value = cliente.valorIncidente;
            document.getElementById('editViatico').value = cliente.viatico;
            document.getElementById('editEstacionamiento').value = cliente.estacionamiento;
            
            // Actualizar los valores formateados
            ['ValorMantenimiento', 'ValorIncidente', 'Viatico', 'Estacionamiento'].forEach(campo => {
                actualizarValorFormateado({ target: document.getElementById('edit' + campo) });
            });

            document.getElementById('modalEditarCliente').showModal();
        })
        .catch(error => {
            console.error('Error al cargar el cliente:', error);
            alert('No se pudo cargar la información del cliente. Por favor, intente de nuevo.');
        });
}

function actualizarCliente(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const clienteData = Object.fromEntries(formData.entries());
    const id = clienteData.id;
    delete clienteData.id;

    // Asegurarse de que los valores monetarios sean números
    ['valorMantenimiento', 'valorIncidente', 'viatico', 'estacionamiento'].forEach(campo => {
        clienteData[campo] = parseInt(clienteData[campo], 10);
    });

    fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Cliente actualizado:', data);
            cargarClientes();
            document.getElementById('modalEditarCliente').close();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

