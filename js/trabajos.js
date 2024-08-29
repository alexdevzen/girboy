function guardarTrabajo(trabajo) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["trabajos"], "readwrite");
        const trabajosStore = transaction.objectStore("trabajos");
        const request = trabajo.id ? trabajosStore.put(trabajo) : trabajosStore.add(trabajo);

        request.onsuccess = function() {
            console.log("Trabajo guardado exitosamente");
            resolve();
        };

        request.onerror = function() {
            console.error("Error al guardar trabajo", request.error);
            reject(request.error);
        };
    });
}

function obtenerTodosLosTrabajos() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["trabajos"], "readonly");
        const trabajosStore = transaction.objectStore("trabajos");
        const request = trabajosStore.getAll();

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function obtenerTrabajosPorRangoFecha(fechaInicio, fechaFin) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["trabajos"], "readonly");
        const trabajosStore = transaction.objectStore("trabajos");
        const index = trabajosStore.index("fecha");
        const range = IDBKeyRange.bound(fechaInicio.toISOString().split('T')[0], fechaFin.toISOString().split('T')[0]);
        const request = index.getAll(range);

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function editarTrabajo(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["trabajos"], "readonly");
        const trabajosStore = transaction.objectStore("trabajos");
        const request = trabajosStore.get(id);

        request.onsuccess = function() {
            resolve(request.result);
        };

        request.onerror = function() {
            reject(request.error);
        };
    });
}

function eliminarTrabajo(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["trabajos"], "readwrite");
        const trabajosStore = transaction.objectStore("trabajos");
        const request = trabajosStore.delete(id);

        request.onsuccess = function() {
            console.log("Trabajo eliminado exitosamente");
            resolve();
        };

        request.onerror = function() {
            console.error("Error al eliminar trabajo", request.error);
            reject(request.error);
        };
    });
}