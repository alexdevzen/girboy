// Objeto para almacenar referencias a elementos del DOM
const DOM = {
    formularioCliente: document.getElementById('formularioCliente'),
    formularioEditarCliente: document.getElementById('formularioEditarCliente'),
    cuerpoTablaClientes: document.getElementById('cuerpoTablaClientes'),
    modalEditarCliente: document.getElementById('modalEditarCliente'),
    cerrarModal: document.getElementById('cerrarModal')
};

// Campos del formulario que requieren formateo de moneda
const camposMoneda = ['valorMantenimiento', 'valorIncidente', 'viatico', 'estacionamiento'];

/**
 * Objeto para manejar las operaciones relacionadas con los clientes
 */
const ClienteManager = {
    /**
     * Carga y muestra la lista de clientes
     */
    async cargarClientes() {
        try {
            const response = await fetch('/api/clientes');
            if (!response.ok) throw new Error('Error al cargar los clientes');
            const clientes = await response.json();
            this.renderizarTablaClientes(clientes);
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al cargar los clientes. Por favor, recargue la página.');
        }
    },

    /**
     * Renderiza la tabla de clientes
     * @param {Array} clientes - Lista de clientes a mostrar
     */
    renderizarTablaClientes(clientes) {
        DOM.cuerpoTablaClientes.innerHTML = '';
        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Código">${cliente.codigo}</td>
                <td data-label="Cliente">${cliente.cliente}</td>
                <td data-label="Dirección">${cliente.direccion}</td>
                <td data-label="Ciudad">${cliente.ciudad}</td>
                <td data-label="Valor Mantenimiento">${formatearValorMoneda(cliente.valorMantenimiento)}</td>
                <td data-label="Valor Incidente">${formatearValorMoneda(cliente.valorIncidente)}</td>
                <td data-label="Viático">${formatearValorMoneda(cliente.viatico)}</td>
                <td data-label="Estacionamiento">${formatearValorMoneda(cliente.estacionamiento)}</td>
                <td data-label="Acciones">
                    <button onclick="ClienteManager.editarCliente('${cliente._id}')" class="btn-editar">Editar</button>
                    <button onclick="ClienteManager.eliminarCliente('${cliente._id}')" class="btn-eliminar">Eliminar</button>
                </td>
            `;
            DOM.cuerpoTablaClientes.appendChild(tr);
        });
    },

    /**
     * Agrega un nuevo cliente
     * @param {Event} event - Evento del formulario
     */
    async agregarCliente(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const clienteData = Object.fromEntries(formData.entries());

        if (!this.validarDatosCliente(clienteData)) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }

        this.convertirValoresMonetarios(clienteData);

        try {
            const response = await fetch('/api/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clienteData),
            });
            if (!response.ok) throw new Error('Error al agregar el cliente');
            const data = await response.json();
            console.log('Cliente agregado:', data);
            this.cargarClientes();
            this.resetearFormulario(event.target);
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al agregar el cliente. Por favor, intente de nuevo.');
        }
    },

    /**
     * Carga los datos de un cliente para edición
     * @param {string} id - ID del cliente a editar
     */
    async editarCliente(id) {
        try {
            const response = await fetch(`/api/clientes/${id}`);
            if (!response.ok) throw new Error('Error al cargar los datos del cliente');
            const cliente = await response.json();
            if (!cliente) throw new Error('Cliente no encontrado');

            this.llenarFormularioEdicion(cliente);
            DOM.modalEditarCliente.showModal();
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo cargar la información del cliente. Por favor, intente de nuevo.');
        }
    },

    /**
     * Llena el formulario de edición con los datos del cliente
     * @param {Object} cliente - Datos del cliente a editar
     */
    llenarFormularioEdicion(cliente) {
        document.getElementById('editId').value = cliente._id;
        document.getElementById('editCodigo').value = cliente.codigo;
        document.getElementById('editCliente').value = cliente.cliente;
        document.getElementById('editDireccion').value = cliente.direccion;
        document.getElementById('editCiudad').value = cliente.ciudad;
        document.getElementById('editValorMantenimiento').value = cliente.valorMantenimiento;
        document.getElementById('editValorIncidente').value = cliente.valorIncidente;
        document.getElementById('editViatico').value = cliente.viatico;
        document.getElementById('editEstacionamiento').value = cliente.estacionamiento;

        camposMoneda.forEach(campo => {
            actualizarValorFormateado({ target: document.getElementById('edit' + campo.charAt(0).toUpperCase() + campo.slice(1)) });
        });
    },

    /**
     * Actualiza los datos de un cliente
     * @param {Event} event - Evento del formulario
     */
    async actualizarCliente(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const clienteData = Object.fromEntries(formData.entries());
        const id = clienteData.id;
        delete clienteData.id;

        if (!this.validarDatosCliente(clienteData)) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }

        this.convertirValoresMonetarios(clienteData);

        try {
            const response = await fetch(`/api/clientes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clienteData),
            });
            if (!response.ok) throw new Error('Error al actualizar el cliente');
            const data = await response.json();
            console.log('Cliente actualizado:', data);
            this.cargarClientes();
            this.cerrarModalEdicion();
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al actualizar el cliente. Por favor, intente de nuevo.');
        }
    },

    /**
     * Elimina un cliente
     * @param {string} id - ID del cliente a eliminar
     */
    async eliminarCliente(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
            try {
                const response = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Error al eliminar el cliente');
                const data = await response.json();
                console.log('Cliente eliminado:', data);
                this.cargarClientes();
            } catch (error) {
                console.error('Error:', error);
                alert('No se pudo eliminar el cliente. Por favor, intente de nuevo.');
            }
        }
    },

    /**
     * Cierra el modal de edición de cliente
     */
    cerrarModalEdicion() {
        DOM.modalEditarCliente.close();
    },

    /**
     * Limpia los campos formateados del formulario
     */
    limpiarCamposFormateados() {
        camposMoneda.forEach(campo => {
            document.getElementById(campo + 'Formatted').textContent = '';
        });
    },

    /**
     * Resetea el formulario y limpia los campos formateados
     * @param {HTMLFormElement} formulario - Formulario a resetear
     */
    resetearFormulario(formulario) {
        formulario.reset();
        this.limpiarCamposFormateados();
    },

    /**
     * Valida los datos del cliente antes de enviar al servidor
     * @param {Object} clienteData - Datos del cliente a validar
     * @return {boolean} True si los datos son válidos, false en caso contrario
     */
    validarDatosCliente(clienteData) {
        const camposRequeridos = ['codigo', 'cliente', 'direccion', 'ciudad'];
        return camposRequeridos.every(campo => clienteData[campo] && clienteData[campo].trim() !== '');
    },

    /**
     * Convierte los valores monetarios a números
     * @param {Object} clienteData - Datos del cliente
     */
    convertirValoresMonetarios(clienteData) {
        camposMoneda.forEach(campo => {
            clienteData[campo] = parseFloat(clienteData[campo]) || 0;
        });
    }
};

/**
 * Formatea un valor numérico a formato de moneda chilena
 * @param {number} valor - Valor a formatear
 * @return {string} Valor formateado como moneda chilena
 */
function formatearValorMoneda(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
}

/**
 * Actualiza el valor formateado en tiempo real mientras el usuario escribe
 * @param {Event} event - Evento de input
 */
function actualizarValorFormateado(event) {
    const campo = event.target;
    const valor = parseFloat(campo.value) || 0;
    const valorFormateado = document.getElementById(campo.id + 'Formatted');
    valorFormateado.textContent = formatearValorMoneda(valor);
}

/**
 * Inicializa la página cuando el DOM está completamente cargado
 */
function initializePage() {
    ClienteManager.cargarClientes();
    DOM.formularioCliente.addEventListener('submit', ClienteManager.agregarCliente.bind(ClienteManager));
    DOM.formularioEditarCliente.addEventListener('submit', ClienteManager.actualizarCliente.bind(ClienteManager));
    DOM.cerrarModal.addEventListener('click', ClienteManager.cerrarModalEdicion);

    // Configura event listeners para formateo en tiempo real
    camposMoneda.forEach(campo => {
        document.getElementById(campo).addEventListener('input', actualizarValorFormateado);
        document.getElementById('edit' + campo.charAt(0).toUpperCase() + campo.slice(1)).addEventListener('input', actualizarValorFormateado);
    });
}

// Inicializar la página cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initializePage);