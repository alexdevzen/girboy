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
    // Aquí deberías hacer una llamada a tu API para obtener los trabajos
    // Por ahora, usaremos datos de ejemplo
    const trabajos = [
        { id: 1, nombre: 'Diseño de logo', cliente: 'Empresa A', fecha: '2024-08-15' },
        { id: 2, nombre: 'Desarrollo web', cliente: 'Empresa B', fecha: '2024-08-20' },
        { id: 3, nombre: 'SEO', cliente: 'Empresa C', fecha: '2024-08-25' }
    ];

    const tbody = document.getElementById('cuerpoTablaTrabajosListado');
    tbody.innerHTML = '';

    trabajos.forEach(trabajo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${trabajo.id}</td>
            <td>${trabajo.nombre}</td>
            <td>${trabajo.cliente}</td>
            <td>${trabajo.fecha}</td>
        `;
        tbody.appendChild(tr);
    });
}