document.addEventListener('DOMContentLoaded', function () {
    cargarTrabajos();
    document.getElementById('formularioTrabajo').addEventListener('submit', agregarTrabajo);
});

function cargarTrabajos() {
    fetch('/api/trabajos')
        .then(response => response.json())
        .then(trabajos => {
            const tbody = document.getElementById('cuerpoTablaTrabajos');
            tbody.innerHTML = '';
            trabajos.forEach(trabajo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${trabajo._id}</td>
                    <td>${trabajo.nombre}</td>
                    <td>${trabajo.cliente}</td>
                    <td>${trabajo.fecha}</td>
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