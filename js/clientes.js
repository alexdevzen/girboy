function guardarCliente(cliente) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["clientes"], "readwrite");
        const clientesStore = transaction.objectStore("clientes");
        const request = cliente.id ? clientesStore.put(cliente) : clientesStore.add(cliente);

        request.onsuccess = function() {
            console.log("Cliente guardado exitosamente");
            resolve();
        };

        request.onerror = function() {
            console.error("Error al guardar cliente", request.error);
            reject(request.error);
        };
    });
}

function obtenerTodosLosClientes() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["clientes"], "readonly");
        const clientesStore = transaction.objectStore("clientes");
        const request = clientesStore.getAll();

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function editarCliente(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["clientes"], "readonly");
        const clientesStore = transaction.objectStore("clientes");
        const request = clientesStore.get(id);

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function eliminarCliente(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["clientes"], "readwrite");
        const clientesStore = transaction.objectStore("clientes");
        const request = clientesStore.delete(id);

        request.onsuccess = function() {
            console.log("Cliente eliminado exitosamente");
            resolve();
        };

        request.onerror = function() {
            console.error("Error al eliminar cliente", request.error);
            reject(request.error);
        };
    });
}

function obtenerClientePorCodigo(codigo) {
    return new Promise((resolve, reject) => {
        if (!codigo) {
            resolve(null);
            return;
        }
        const transaction = db.transaction(["clientes"], "readonly");
        const clientesStore = transaction.objectStore("clientes");
        const index = clientesStore.index("codigo");
        const request = index.get(codigo);

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}