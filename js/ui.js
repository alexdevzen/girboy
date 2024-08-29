function actualizarRegistros() {
    obtenerTodosLosTrabajos().then(trabajos => {
        if (trabajos.length === 0) {
            document.getElementById('registros-body').innerHTML = "<tr><td colspan='9'>No hay trabajos registrados.</td></tr>";
            return;
        }

        Promise.all(trabajos.map(t => {
            return obtenerClientePorCodigo(t.codigoCliente).then(cliente => {
                return `
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
                `;
            });
        })).then(filas => {
            document.getElementById('registros-body').innerHTML = filas.join('');
        });
    }).catch(error => {
        console.error("Error al actualizar registros:", error);
    });
}

function cargarClientesEnSelect() {
    obtenerTodosLosClientes().then(clientes => {
        const select = document.getElementById('codigoCliente');
        select.innerHTML = '<option value="">Seleccione un cliente</option>';
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.codigo;
            option.textContent = `${cliente.codigo} - ${cliente.nombre}`;
            select.appendChild(option);
        });
    }).catch(error => {
        console.error("Error al cargar clientes en select:", error);
    });
}

function actualizarListaClientes() {
    obtenerTodosLosClientes().then(clientes => {
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
    }).catch(error => {
        console.error("Error al actualizar lista de clientes:", error);
    });
}