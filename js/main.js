document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado, inicializando aplicación");
    inicializarDB().then(() => {
        inicializarPagina();
    }).catch(error => {
        console.error("Error al inicializar la base de datos:", error);
    });
});

function inicializarPagina() {
    if (document.getElementById('registros')) {
        actualizarRegistros();
    }
    if (document.getElementById('graficoMensual')) {
        inicializarGrafico();
    }
    if (document.getElementById('listaClientes')) {
        actualizarListaClientes();
    }
    if (document.getElementById('codigoCliente')) {
        cargarClientesEnSelect();
    }
}

function inicializarGrafico() {
    const ctx = document.getElementById('graficoMensual').getContext('2d');
    const graficoMensual = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monto Total',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const mesGraficoInput = document.getElementById('mesGrafico');
    const fechaActual = new Date();
    mesGraficoInput.value = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
    
    actualizarGrafico(mesGraficoInput.value, graficoMensual);

    mesGraficoInput.addEventListener('change', function() {
        actualizarGrafico(this.value, graficoMensual);
    });
}

function actualizarGrafico(mesSeleccionado, graficoMensual) {
    const [año, mes] = mesSeleccionado.split('-');
    const primerDiaMes = new Date(año, mes - 1, 1);
    const ultimoDiaMes = new Date(año, mes, 0);

    obtenerTrabajosPorRangoFecha(primerDiaMes, ultimoDiaMes).then(trabajos => {
        const datosGrafico = {};

        trabajos.forEach(trabajo => {
            const fecha = trabajo.fecha;
            const montoTotal = trabajo.monto + trabajo.viatico + trabajo.estacionamiento;

            if (datosGrafico[fecha]) {
                datosGrafico[fecha] += montoTotal;
            } else {
                datosGrafico[fecha] = montoTotal;
            }
        });

        const fechas = Object.keys(datosGrafico).sort();
        const montos = fechas.map(fecha => datosGrafico[fecha]);

        graficoMensual.data.labels = fechas;
        graficoMensual.data.datasets[0].data = montos;
        graficoMensual.update();
    });
}