document.addEventListener('DOMContentLoaded', function () {
    // Cargar gráfico de ganancias
    cargarGraficoGanancias();

    // Cargar lista de trabajos
    cargarListaTrabajos();
});

function cargarGraficoGanancias() {
    const ctx = document.getElementById('graficoGanancias').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
            datasets: [{
                label: 'Ganancias Mensuales',
                data: [4000, 3000, 5000, 4500, 6000, 5500],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function cargarListaTrabajos() {
    fetch('/api/trabajos')
        .then(response => response.json())
        .then(trabajos => {
            const tbody = document.getElementById('cuerpoTablaTrabajosListado');
            tbody.innerHTML = '';

            trabajos.forEach(trabajo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Fecha">${trabajo.fecha}</td>
                    <td data-label="Código">${trabajo.codigo || 'N/A'}</td>
                    <td data-label="Tipo">${trabajo.tipo}</td>
                    <td data-label="Cliente">${trabajo.codigoCliente}</td>
                    <td data-label="Ciudad">${trabajo.ciudad}</td>
                    <td data-label="Valor">${formatearMoneda(trabajo.valor)}</td>
                    <td data-label="Viático">${formatearMoneda(trabajo.viatico)}</td>
                    <td data-label="Estacionamiento">${formatearMoneda(trabajo.estacionamiento)}</td>
                    <td data-label="Descripción">${trabajo.descripcion}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error al cargar los trabajos:', error));
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
}