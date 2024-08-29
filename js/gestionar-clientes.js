document.addEventListener('DOMContentLoaded', function () {
    cargarClientes();
    document.getElementById('formularioCliente').addEventListener('submit', agregarCliente);
});

function cargarClientes() {
    fetch('/api/clientes')
        .then(response => response.json())
        .then(clientes => {
            const tbody = document.getElementById('cuerpoTablaClientes');
            tbody.innerHTML = '';
            clientes.forEach(cliente => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cliente.codigo}</td>
                    <td>${cliente.cliente}</td>
                    <td>${cliente.direccion}</td>
                    <td>${cliente.ciudad}</td>
                    <td><button onclick="eliminarCliente('${cliente._id}')">Eliminar</button></td>
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
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function eliminarCliente(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
        fetch(`/api/clientes/${id}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                console.log('Cliente eliminado:', data);
                cargarClientes(); // Recargar la lista de clientes
            })
            .catch(error => console.error('Error:', error));
    }
}