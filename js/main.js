/**
 * Variable global para mantener la referencia al gráfico de ganancias
 */
let graficoIngresos;

/**
 * Inicializa la página cuando el DOM está completamente cargado
 */
document.addEventListener('DOMContentLoaded', function () {
    llenarSelectorAño();
    cargarGraficoIngresos();
    cargarListaTrabajos();
    document.getElementById('formularioFiltro').addEventListener('submit', filtrarTrabajos);
    document.getElementById('añoGanancias').addEventListener('change', cargarGraficoIngresos);
});
/**
 * Llena el selector de año con opciones desde el año actual hasta 5 años atrás
 */
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

/**
 * Carga y muestra el gráfico de ganancias para el año seleccionado
 */
function cargarGraficoIngresos() {
    const año = document.getElementById('añoGanancias').value || new Date().getFullYear();

    fetch(`/api/ganancias?año=${año}`)
        .then(response => response.json())
        .then(ganancias => {
            const ctx = document.getElementById('graficoIngresos').getContext('2d');
            const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            if (graficoIngresos) {
                graficoIngresos.destroy();
            }

            graficoIngresos = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: ganancias,
                        backgroundColor: 'rgba(52, 152, 219, 0.5)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return formatearMoneda(context.raw);
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatearMoneda(value, true);
                                }
                            }
                        },
                        y: {
                            ticks: {
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });

            actualizarResumenIngresos(ganancias);
        })
        .catch(error => console.error('Error al cargar las ganancias:', error));
}

function actualizarResumenIngresos(ganancias) {
    const resumenElement = document.getElementById('ingresosResumen');
    const total = ganancias.reduce((a, b) => a + b, 0);
    const promedio = total / ganancias.length;
    const max = Math.max(...ganancias);

    resumenElement.innerHTML = `
        <span>Total: ${formatearMoneda(total)}</span>
        <span>Promedio: ${formatearMoneda(promedio)}</span>
        <span>Máximo: ${formatearMoneda(max)}</span>
    `;
}

function actualizarDetalleIngresos(ganancias, labels) {
    const detalleElement = document.getElementById('ingresosDetalle');
    const total = ganancias.reduce((a, b) => a + b, 0);
    const promedio = total / ganancias.length;
    const max = Math.max(...ganancias);
    const maxMes = labels[ganancias.indexOf(max)];

    detalleElement.innerHTML = `
        <span>Total: ${formatearMoneda(total)}</span>
        <span>Promedio: ${formatearMoneda(promedio)}</span>
        <span>Máximo: ${formatearMoneda(max)} (${maxMes})</span>
    `;
}

/**
 * Carga la lista de trabajos, opcionalmente filtrada por año y mes
 * @param {number} [anio] - Año para filtrar los trabajos
 * @param {number} [mes] - Mes para filtrar los trabajos
 */
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
                    <td>${trabajo.fecha}</td>
                    <td>${trabajo.codigo || 'N/A'}</td>
                    <td>${trabajo.tipo}</td>
                    <td>${trabajo.codigoCliente}</td>
                    <td>${trabajo.ciudad}</td>
                    <td>${formatearMoneda(trabajo.valor)}</td>
                    <td>${formatearMoneda(trabajo.viatico)}</td>
                    <td>${formatearMoneda(trabajo.estacionamiento)}</td>
                    <td>${trabajo.descripcion}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error al cargar los trabajos:', error));
}


/**
 * Filtra los trabajos por el mes seleccionado
 * @param {Event} event - Evento del formulario
 */
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

/**
 * Formatea un valor numérico a formato de moneda chilena
 * @param {number} valor - Valor a formatear
 * @return {string} Valor formateado como moneda chilena
 */
function formatearMoneda(valor, abreviado = false) {
    const opciones = {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    };

    if (abreviado) {
        if (valor >= 1000000) {
            return new Intl.NumberFormat('es-CL', opciones).format(valor / 1000000) + 'M';
        } else if (valor >= 1000) {
            return new Intl.NumberFormat('es-CL', opciones).format(valor / 1000) + 'K';
        }
    }

    return new Intl.NumberFormat('es-CL', opciones).format(valor);
}