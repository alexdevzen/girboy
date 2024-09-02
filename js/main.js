document.addEventListener('DOMContentLoaded', function () {
    llenarSelectorAño();
    cargarGraficoGanancias();
    cargarListaTrabajos();
    document.getElementById('formularioFiltro').addEventListener('submit', filtrarTrabajos);
    document.getElementById('añoGanancias').addEventListener('change', cargarGraficoGanancias);
});

function llenarSelectorAño() {
    const selectAño = document.getElementById('añoGanancias');
    const añoActual = new Date().getFullYear();
    for (let i = añoActual; i >= añoActual - 5; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        selectAño.appendChild(option);
    }
}

let graficoGanancias; // Variable global para mantener la referencia al gráfico

function cargarGraficoGanancias() {
    const año = document.getElementById('añoGanancias').value || new Date().getFullYear();
    
    fetch(`/api/ganancias?año=${año}`)
        .then(response => response.json())
        .then(ganancias => {
            const ctx = document.getElementById('graficoGanancias').getContext('2d');

            // Destruir el gráfico existente si hay uno
            if (graficoGanancias) {
                graficoGanancias.destroy();
            }

            // Crear el nuevo gráfico
            graficoGanancias = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                    datasets: [{
                        label: 'Ganancias Mensuales',
                        data: ganancias,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value, index, values) {
                                    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error al cargar las ganancias:', error));
}

function cargarListaTrabajos(anio, mes) {
    let url = '/api/trabajos';
    if (anio && mes) {
        url += `?anio=${anio}&mes=${mes}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(trabajos => {
            const tbody = document.getElementById('cuerpoTablaTrabajosListado');
            tbody.innerHTML = '';

            if (trabajos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9">No se encontraron trabajos para el período seleccionado.</td></tr>';
                return;
            }

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

function filtrarTrabajos(event) {
    event.preventDefault();
    const mesSeleccionado = document.getElementById('mes').value;
    
    if (!mesSeleccionado) {
        alert('Por favor, seleccione un mes para filtrar.');
        return;
    }

    const [anio, mes] = mesSeleccionado.split('-');
    cargarListaTrabajos(anio, mes);
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
}