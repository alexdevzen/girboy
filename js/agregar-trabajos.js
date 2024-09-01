document.addEventListener('DOMContentLoaded', function () {
    cargarTrabajos();
    cargarCodigosClientes();
    document.getElementById('formularioTrabajo').addEventListener('submit', agregarTrabajo);
});

function cargarCodigosClientes() {
    fetch('/api/clientes')
        .then(response => response.json())
        .then(clientes => {
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

function cargarTrabajos() {
    fetch('/api/trabajos')
        .then(response => response.json())
        .then(trabajos => {
            const tbody = document.getElementById('cuerpoTablaTrabajos');
            tbody.innerHTML = '';
            trabajos.forEach(trabajo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="ID">${trabajo._id}</td>
                    <td data-label="Fecha">${trabajo.fecha}</td>
                    <td data-label="Código">${trabajo.codigo || 'N/A'}</td>
                    <td data-label="Tipo">${trabajo.tipo}</td>
                    <td data-label="Cliente">${trabajo.codigoCliente}</td>
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

    // Si el código está vacío, lo eliminamos del objeto para que no se envíe
    if (!trabajoData.codigo) {
        delete trabajoData.codigo;
    }

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
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}