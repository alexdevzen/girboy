let db;
let graficoMensual;

// Abrir conexión con IndexedDB
const request = indexedDB.open("SistemaRegistroTrabajosDB", 4);

request.onerror = function(event) {
    console.error("Error al abrir la base de datos", event);
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Base de datos abierta exitosamente");
    inicializarPagina();
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('trabajos')) {
        const trabajosStore = db.createObjectStore("trabajos", { keyPath: "id", autoIncrement: true });
        trabajosStore.createIndex("fecha", "fecha", { unique: false });
        trabajosStore.createIndex("codigoCliente", "codigoCliente", { unique: false });
    }
    if (!db.objectStoreNames.contains('clientes')) {
        const clientesStore = db.createObjectStore("clientes", { keyPath: "id", autoIncrement: true });
        clientesStore.createIndex("codigo", "codigo", { unique: true });
    }
    
    if (event.oldVersion < 4) {
        const clientesStore = event.currentTarget.transaction.objectStore("clientes");
        if (!clientesStore.indexNames.contains("direccion")) {
            clientesStore.createIndex("direccion", "direccion", { unique: false });
        }
    }
};

function inicializarPagina() {
    if (document.getElementById('registros')) {
        actualizarRegistros();
    }
    if (document.getElementById('graficoMensual')) {
        inicializarGrafico();
    }
    if (document.getElementById('listaClientes')) {
        cargarClientes();
    }
    if (document.getElementById('codigoCliente')) {
        cargarClientesEnSelect();
    }
    if (document.getElementById('trabajos-body')) {
        actualizarTablaTrabajosEditable();
    }
}

function cargarClientesEnSelect() {
    const select = document.getElementById('codigoCliente');
    const transaction = db.transaction(["clientes"], "readonly");
    const clientesStore = transaction.objectStore("clientes");
    const request = clientesStore.getAll();

    request.onsuccess = function() {
        const clientes = request.result;
        select.innerHTML = '<option value="">Seleccione un cliente</option>';
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.codigo;
            option.textContent = `${cliente.codigo} - ${cliente.nombre}`;
            select.appendChild(option);
        });
    };
}

if (document.getElementById('trabajoForm')) {
    document.getElementById('trabajoForm').onsubmit = function(e) {
        e.preventDefault();
        const trabajo = {
            fecha: document.getElementById('fechaTrabajo').value,
            codigoCliente: document.getElementById('codigoCliente').value,
            tipo: document.getElementById('tipoTrabajo').value,
            descripcion: document.getElementById('descripcionTrabajo').value,
            monto: parseFloat(document.getElementById('montoTrabajo').value),
            viatico: parseFloat(document.getElementById('montoViatico').value) || 0,
            estacionamiento: parseFloat(document.getElementById('montoEstacionamiento').value) || 0
        };

        const trabajoId = document.getElementById('trabajoId').value;
        const transaction = db.transaction(["trabajos"], "readwrite");
        const trabajosStore = transaction.objectStore("trabajos");

        let request;
        if (trabajoId) {
            trabajo.id = parseInt(trabajoId);
            request = trabajosStore.put(trabajo);
        } else {
            request = trabajosStore.add(trabajo);
        }

        request.onsuccess = function() {
            console.log("Trabajo guardado exitosamente");
            document.getElementById('trabajoForm').reset();
            document.getElementById('trabajoId').value = '';
            document.querySelector('#trabajoForm button[type="submit"]').textContent = 'Guardar Trabajo';
            actualizarTablaTrabajosEditable();
        };

        request.onerror = function() {
            console.error("Error al guardar trabajo", request.error);
        };
    };
}

function inicializarGrafico() {
    const ctx = document.getElementById('graficoMensual').getContext('2d');
    graficoMensual = new Chart(ctx, {
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
    
    actualizarGrafico(mesGraficoInput.value);

    mesGraficoInput.addEventListener('change', function() {
        actualizarGrafico(this.value);
    });
}

function actualizarGrafico(mesSeleccionado) {
    const [año, mes] = mesSeleccionado.split('-');
    const primerDiaMes = new Date(año, mes - 1, 1);
    const ultimoDiaMes = new Date(año, mes, 0);

    const transaction = db.transaction(["trabajos"], "readonly");
    const trabajosStore = transaction.objectStore("trabajos");
    const index = trabajosStore.index("fecha");

    const request = index.getAll(IDBKeyRange.bound(
        primerDiaMes.toISOString().split('T')[0],
        ultimoDiaMes.toISOString().split('T')[0]
    ));

    request.onsuccess = function() {
        const trabajos = request.result;
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
    };
}

function actualizarRegistros() {
    console.log("Iniciando actualización de registros");
    const trabajosTransaction = db.transaction(["trabajos", "clientes"], "readonly");
    const trabajosStore = trabajosTransaction.objectStore("trabajos");
    const clientesStore = trabajosTransaction.objectStore("clientes");
    
    const trabajosRequest = trabajosStore.getAll();
    
    trabajosRequest.onsuccess = function() {
        const trabajos = trabajosRequest.result;
        console.log("Trabajos obtenidos:", trabajos);
        
        if (trabajos.length === 0) {
            console.log("No hay trabajos para mostrar");
            document.getElementById('registros-body').innerHTML = "<tr><td colspan='9'>No hay trabajos registrados.</td></tr>";
            return;
        }
        
        Promise.all(trabajos.map(t => {
            return new Promise((resolve) => {
                const clienteRequest = clientesStore.index('codigo').get(t.codigoCliente);
                clienteRequest.onsuccess = function() {
                    const cliente = clienteRequest.result;
                    resolve(`
                        <tr>
                            <td>${t.fecha}</td>
                            <td>${t.codigoCliente}</td>
                            <td>${cliente ? cliente.nombre : 'Cliente no encontrado'}</td>
                            <td>${t.tipo}</td>
                            <td>${t.descripcion}</td>
                            <td>$${t.monto.toFixed(2)}</td>
                            <td>$${t.viatico.toFixed(2)}</td>
                            <td>$${t.estacionamiento.toFixed(2)}</td>
                            <td>
                                <button onclick="editarTrabajo(${t.id})">Editar</button>
                                <button onclick="eliminarTrabajo(${t.id})">Eliminar</button>
                            </td>
                        </tr>
                    `);
                };
            });
        })).then(filas => {
            console.log("Actualizando HTML de registros");
            document.getElementById('registros-body').innerHTML = filas.join('');
        }).catch(error => {
            console.error("Error al generar la tabla de trabajos:", error);
        });
    };
    
    trabajosRequest.onerror = function(event) {
        console.error("Error al obtener trabajos:", event.target.error);
    };
}

function actualizarTablaTrabajosEditable() {
    const trabajosTransaction = db.transaction(["trabajos", "clientes"], "readonly");
    const trabajosStore = trabajosTransaction.objectStore("trabajos");
    const clientesStore = trabajosTransaction.objectStore("clientes");
    
    const trabajosRequest = trabajosStore.getAll();
    
    trabajosRequest.onsuccess = function() {
        const trabajos = trabajosRequest.result;
        
        if (trabajos.length === 0) {
            document.getElementById('trabajos-body').innerHTML = "<tr><td colspan='10'>No hay trabajos registrados.</td></tr>";
            return;
        }
        
        Promise.all(trabajos.map(t => {
            return new Promise((resolve) => {
                const clienteRequest = clientesStore.index('codigo').get(t.codigoCliente);
                clienteRequest.onsuccess = function() {
                    const cliente = clienteRequest.result;
                    resolve(`
                        <tr>
                            <td>${t.fecha}</td>
                            <td>${t.codigoCliente}</td>
                            <td>${cliente ? cliente.nombre : 'Cliente no encontrado'}</td>
                            <td>${t.tipo}</td>
                            <td>${t.descripcion}</td>
                            <td>$${t.monto.toFixed(2)}</td>
                            <td>$${t.viatico.toFixed(2)}</td>
                            <td>$${t.estacionamiento.toFixed(2)}</td>
                            <td>
                                <button onclick="editarTrabajo(${t.id})">Editar</button>
                            </td>
                            <td>
                                <button onclick="eliminarTrabajo(${t.id})">Eliminar</button>
                            </td>
                        </tr>
                    `);
                };
            });
        })).then(filas => {
            document.getElementById('trabajos-body').innerHTML = filas.join('');
        });
    };
}

function editarTrabajo(id) {
    const transaction = db.transaction(["trabajos"], "readonly");
    const trabajosStore = transaction.objectStore("trabajos");
    const request = trabajosStore.get(id);

    request.onsuccess = function() {
        const trabajo = request.result;
        document.getElementById('trabajoId').value = trabajo.id;
        document.getElementById('fechaTrabajo').value = trabajo.fecha;
        document.getElementById('codigoCliente').value = trabajo.codigoCliente;
        document.getElementById('tipoTrabajo').value = trabajo.tipo;
        document.getElementById('descripcionTrabajo').value = trabajo.descripcion;
        document.getElementById('montoTrabajo').value = trabajo.monto;
        document.getElementById('montoViatico').value = trabajo.viatico;
        document.getElementById('montoEstacionamiento').value = trabajo.estacionamiento;
        
        document.querySelector('#trabajoForm button[type="submit"]').textContent = 'Actualizar Trabajo';
    };
}

function eliminarTrabajo(id) {
    if (confirm('¿Está seguro de que desea eliminar este trabajo?')) {
        const transaction = db.transaction(["trabajos"], "readwrite");
        const trabajosStore = transaction.objectStore("trabajos");
        const request = trabajosStore.delete(id);

        request.onsuccess = function() {
            console.log("Trabajo eliminado exitosamente");
            actualizarTablaTrabajosEditable();
        };

        request.onerror = function() {
            console.error("Error al eliminar trabajo", request.error);
        };
    }
}

if (document.getElementById('clienteForm')) {
    document.getElementById('clienteForm').onsubmit = function(e) {
        e.preventDefault();
        const cliente = {
            codigo: document.getElementById('codigoCliente').value,
            nombre: document.getElementById('nombreCliente').value,
            direccion: document.getElementById('direccionCliente').value,
            ciudad: document.getElementById('ciudadCliente').value
        };
        const clienteId = document.getElementById('clienteId').value;

        const transaction = db.transaction(["clientes"], "readwrite");
        const clientesStore = transaction.objectStore("clientes");

        let request;
        if (clienteId) {
            cliente.id = parseInt(clienteId);
            request = clientesStore.put(cliente);
        } else {
            request = clientesStore.add(cliente);
        }

        request.onsuccess = function() {
            console.log("Cliente guardado exitosamente");
            document.getElementById('clienteForm').reset();
            document.getElementById('clienteId').value = '';
            cargarClientes();
        };

        request.onerror = function() {
            console.error("Error al guardar cliente", request.error);
        };
    };
}

function cargarClientes() {
    const transaction = db.transaction(["clientes"], "readonly");
    const clientesStore = transaction.objectStore("clientes");
    const request = clientesStore.getAll();

    request.onsuccess = function() {
        const clientes = request.result;
        const listaHTML = clientes.map(cliente => `
            <div role="listitem">
                <h3>${cliente.nombre}</h3>
                <p><strong>Código:</strong> ${cliente.codigo}</p>
                <p><strong>Dirección:</strong> ${cliente.direccion}</p>
                <p><strong>Ciudad:</strong> ${cliente.ciudad}</p>
                <div class="button-group" role="group" aria-label="Acciones de cliente">
                    <button onclick="editarCliente(${cliente.id})" aria-label="Editar ${cliente.nombre}">Editar</button>
                    <button onclick="eliminarCliente(${cliente.id})" aria-label="Eliminar ${cliente.nombre}">Eliminar</button>
                </div>
            </div>
        `).join('');

        document.getElementById('listaClientes').innerHTML = listaHTML;
    };
}

function editarCliente(id) {
    const transaction = db.transaction(["clientes"], "readonly");
    const clientesStore = transaction.objectStore("clientes");
    const request = clientesStore.get(id);

    request.onsuccess = function() {
        const cliente = request.result;
        document.getElementById('clienteId').value = cliente.id;
        document.getElementById('codigoCliente').value = cliente.codigo;
        document.getElementById('nombreCliente').value = cliente.nombre;
        document.getElementById('direccionCliente').value = cliente.direccion;
        document.getElementById('ciudadCliente').value = cliente.ciudad;
    };
}

function eliminarCliente(id) {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        const transaction = db.transaction(["clientes"], "readwrite");
        const clientesStore = transaction.objectStore("clientes");
        const request = clientesStore.delete(id);

        request.onsuccess = function() {
            console.log("Cliente eliminado exitosamente");
            cargarClientes();
        };

        request.onerror = function() {
            console.error("Error al eliminar cliente", request.error);
        };
    }
}

function actualizarTablaTrabajosEditable() {
    const trabajosTransaction = db.transaction(["trabajos", "clientes"], "readonly");
    const trabajosStore = trabajosTransaction.objectStore("trabajos");
    const clientesStore = trabajosTransaction.objectStore("clientes");
    
    const trabajosRequest = trabajosStore.getAll();
    
    trabajosRequest.onsuccess = function() {
        const trabajos = trabajosRequest.result;
        
        if (trabajos.length === 0) {
            document.getElementById('trabajos-body').innerHTML = "<tr><td colspan='10'>No hay trabajos registrados.</td></tr>";
            return;
        }
        
        Promise.all(trabajos.map(t => {
            return new Promise((resolve) => {
                const clienteRequest = clientesStore.index('codigo').get(t.codigoCliente);
                clienteRequest.onsuccess = function() {
                    const cliente = clienteRequest.result;
                    resolve(`
                        <tr>
                            <td>${t.fecha}</td>
                            <td>${t.codigoCliente}</td>
                            <td>${cliente ? cliente.nombre : 'Cliente no encontrado'}</td>
                            <td>${t.tipo}</td>
                            <td>${t.descripcion}</td>
                            <td>$${t.monto.toFixed(2)}</td>
                            <td>$${t.viatico.toFixed(2)}</td>
                            <td>$${t.estacionamiento.toFixed(2)}</td>
                            <td>
                                <button onclick="editarTrabajo(${t.id})">Editar</button>
                            </td>
                            <td>
                                <button onclick="eliminarTrabajo(${t.id})">Eliminar</button>
                            </td>
                        </tr>
                    `);
                };
            });
        })).then(filas => {
            document.getElementById('trabajos-body').innerHTML = filas.join('');
        });
    };
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM cargado, inicializando aplicación");
    if (db) {
        inicializarPagina();
    } else {
        console.log("La base de datos aún no está lista, esperando...");
    }
});