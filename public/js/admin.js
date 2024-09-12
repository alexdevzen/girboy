function getToken() {
    return localStorage.getItem('token');
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
    }
}

async function loadPendingUsers() {
    try {
        const response = await fetch('/api/admin/pending-users', {
            headers: {
                'x-auth-token': getToken()
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('No tienes permiso para acceder a esta página');
                window.location.href = 'index.html';
                return;
            }
            throw new Error('Failed to fetch pending users');
        }

        const users = await response.json();
        const tableBody = document.querySelector('#pendingUsersTable tbody');
        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <button onclick="approveUser('${user._id}')">Aprobar</button>
                    <button onclick="rejectUser('${user._id}')">Rechazar</button>
                </td>
            `;
        });
    } catch (error) {
        console.error('Error loading pending users:', error);
        alert('Error loading pending users');
    }
}

async function approveUser(userId) {
    try {
        const response = await fetch(`/api/admin/approve-user/${userId}`, {
            method: 'PUT',
            headers: {
                'x-auth-token': getToken()
            }
        });

        if (!response.ok) {
            throw new Error('Failed to approve user');
        }

        alert('User approved successfully');
        loadPendingUsers();
    } catch (error) {
        console.error('Error approving user:', error);
        alert('Error approving user');
    }
}

async function rejectUser(userId) {
    if (confirm('Are you sure you want to reject this user?')) {
        try {
            const response = await fetch(`/api/admin/reject-user/${userId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': getToken()
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reject user');
            }

            alert('User rejected successfully');
            loadPendingUsers();
        } catch (error) {
            console.error('Error rejecting user:', error);
            alert('Error rejecting user');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadPendingUsers();
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
});