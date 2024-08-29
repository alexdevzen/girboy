let db;

const dbName = "SistemaRegistroTrabajosDB";
const dbVersion = 4;

export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = function(event) {
            console.error("Error al abrir la base de datos", event);
            reject("Error al abrir la base de datos");
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            console.log("Base de datos abierta exitosamente");
            resolve(db);
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
    });
}

export function getDB() {
    return db;
}