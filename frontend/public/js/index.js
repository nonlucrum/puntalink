const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:4008"   // dev backend
    : "";                       // production (relative)

export async function createProject(uiElements, callbacks, globalVars) {
    try {
        console.log('[FRONTEND] Creando nuevo proyecto con datos:', globalVars.projectData);

        // Enviar datos al backend
        const response = await fetch(`${API_BASE}/api/proyecto/crear`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(globalVars.projectData)
        });
        
        const data = await response.json();
        console.log("[FRONTEND] Full response:", data);
        
        if (data.ok && data.new_project) {
            console.log("[FRONTEND] Project data to save:", data.new_project);
            // Guardar los datos en localStorage para uso posterior
            localStorage.setItem('projectConfig', JSON.stringify(data.new_project));
            console.log("[FRONTEND] Project saved to localStorage");
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        } else {
            console.error("[FRONTEND] Error in response:", data);
            alert('Error al crear el proyecto: ' + (data.error || 'Respuesta inválida del servidor'));
        }
    } catch (error) {
        console.error('[FRONTEND] Error al crear el proyecto:', error);
        alert('Error al crear el proyecto. Por favor, inténtelo de nuevo.');
    }
}

export async function loadPreviousProjects(userId) {
    console.log('[FRONTEND] Cargando proyectos anteriores...');

    try {
        const response = await fetch(`${API_BASE}/api/proyecto/listar`, {
            method: 'GET',
            headers: {
                'x-user-id': userId
            }
        });

        const projectList = document.getElementById('projectList');
        const data = await response.json();
        localStorage.setItem('previousProjectsList', JSON.stringify(data.proyectos));
        console.log('[FRONTEND] Proyectos obtenidos:', data.proyectos);
        
        // Ordenar proyectos del más nuevo al más antiguo (reverse)
        const proyectosOrdenados = [...data.proyectos].reverse();
        
        // Limpiar la lista actual
        projectList.innerHTML = '';
        // Rellenar la lista con los proyectos obtenidos
        let htmlDetalle = '';
        if (proyectosOrdenados.length === 0) {
            htmlDetalle = '<p>No hay proyectos anteriores.</p>';
        }
        else {
            proyectosOrdenados.forEach(project => {
                let fecha = formatTimestamp(project.updated_at);
                let version = project.version_proyecto != 1 ? `Versión ${project.version_proyecto}` : "";
                htmlDetalle += `
                    <div class="project-card-div">
                        <button class="project-card" data-id="${project.pid}">
                            <div style="display: flex; flex-direction: row">
                            <svg>
                        `;
                    if (project.tipo_muerto === 'Cilindrico') {
                        htmlDetalle += `<circle cx="0" cy="38.5" r="30" stroke="var(--muted)" stroke-width="3.5" fill="transparent" opacity="0.5" />`;
                    } else if (project.tipo_muerto === 'Corrido') {
                        htmlDetalle += `<rect x="-30" y="8.5" width="60" height="60" stroke="var(--muted)" stroke-width="3.5" fill="transparent" opacity="0.5" />`;
                    } else if (project.tipo_muerto === 'Triangular') {
                        htmlDetalle += `<polygon points="-30,12 30,12 0,64" style="fill:transparent;stroke:var(--muted);stroke-width:3.5" opacity="0.5" />`;
                    }
                    htmlDetalle += `
                            </svg>
                            <div class="project-card-title">
                                <div style="display: flex; flex-direction: row;align-items: baseline;gap: 0.5em;">
                                    <h3>${project.nombre}</h3>
                                    <h4>${version}</h4>
                                </div>
                                <h4>${project.empresa}</h4>
                                <text class="project-card-var">Muerto ${project.tipo_muerto}</text>
                                <text class="project-card-var">${fecha}</text>
                            </div>
                            </div>
                            <div class="project-card-info">
                            <text class="project-card-var">${project.ubicacion}</text>
                            <text class="project-card-var">${project.vel_viento} km/h</text>
                            <text class="project-card-var">${project.temp_promedio} °C</text>
                            <text class="project-card-var">${project.presion_atmo} mmHg</text>
                            </div>
                        </button>
                        <div class="project-card-side">
                            <button class="project-card-side-button" data-id="${project.pid}" title="Notas de la versión" style="background: color-mix(in srgb, #1c63e7ff var(--mix-percent), #fff); border-color: #1c63e7ff;">
                                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 3V5M12 3V5M15 3V5M13 9H9M15 13H9M8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V7.2C19 6.0799 19 5.51984 18.782 5.09202C18.5903 4.71569 18.2843 4.40973 17.908 4.21799C17.4802 4 16.9201 4 15.8 4H8.2C7.0799 4 6.51984 4 6.09202 4.21799C5.71569 4.40973 5.40973 4.71569 5.21799 5.09202C5 5.51984 5 6.07989 5 7.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21Z" stroke="#1c63e7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="project-card-side-button" data-id="${project.pid}" title= "Eliminar proyecto" style="background: color-mix(in srgb, #c42f2fff var(--mix-percent), #fff); border-color: #c42f2fff;">
                                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#c42f2fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
                /* const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                projectList.appendChild(option); */
            });
        }
        projectList.innerHTML = htmlDetalle;

        // Now attach listeners to the newly created buttons
        document.querySelectorAll(".project-card").forEach(button => {
        button.addEventListener("click", () => {
            const projectId = button.getAttribute("data-id");
            console.log("[FRONTEND] Proyecto seleccionado con ID:", projectId);
            // You can also trigger a function, e.g.:
            // openProjectDetails(projectId);
            loadProjectById(userId, projectId);
        });
        });
        document.querySelectorAll(".project-card-side-button").forEach(button => {
        button.addEventListener("click", () => {
            if (button.title === "Eliminar proyecto") {
                console.log("[FRONTEND] Botón de eliminar proyecto clickeado.");
                const projectId = button.getAttribute("data-id");
                // Preguntar confirmación antes de eliminar
                if (!confirm("¿Está seguro de que desea eliminar este proyecto? Esta acción no se puede deshacer.")) {
                    console.log("[FRONTEND] Eliminación de proyecto cancelada por el usuario.");
                    return;
                }
                console.log("[FRONTEND] Eliminar proyecto con ID:", projectId);
                deleteProjectById(userId, projectId);
            }
        });
        });
        document.querySelectorAll(".project-card-side-button").forEach(button => {
        button.addEventListener("click", () => {
            if (button.title === "Notas de la versión") {
                console.log("[FRONTEND] Botón de notas de la versión clickeado.");
                const projectId = button.getAttribute("data-id");
                // Mostrar las notas de la versión en un alert
                const proyectos = JSON.parse(localStorage.getItem('previousProjectsList')) || [];
                const proyecto = proyectos.find(p => String(p.pid) === String(projectId));
                if (proyecto) {
                    alert(`Notas de la versión:\n\n${proyecto.notas_version || 'No hay notas disponibles.'}`);
                } else {
                    alert('Notas de la versión:\n\nNo hay notas disponibles.');
                }
            }
        });
        });
    } catch (error) {
        console.error('[FRONTEND] Error al cargar los proyectos anteriores:', error);
        alert('Error al cargar los proyectos anteriores. Por favor, inténtelo de nuevo.');
    }
}

export async function loadProjectById(userId, projectId) {
    console.log('[FRONTEND] Cargando proyecto con ID:', projectId);
    try {
        const response = await fetch(`${API_BASE}/api/proyecto/cargar`, {
            method: 'GET',
            headers: {
                'x-user-id': userId,
                'x-project-id': projectId
            }
        });
        const data = await response.json();
        console.log('[FRONTEND] Proyecto cargado:', data.proyecto);
        if (data.ok && data.proyecto) {
            // Guardar los datos en localStorage para uso posterior
            localStorage.setItem('projectConfig', JSON.stringify(data.proyecto));
            console.log("[FRONTEND] Project loaded to localStorage");
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
        } else {
            console.error("[FRONTEND] Error en la respuesta:", data);
            alert('Error al cargar el proyecto: ' + (data.error || 'Respuesta inválida del servidor'));
        }
    } catch (error) {
        console.error('[FRONTEND] Error al cargar el proyecto:', error);
        alert('Error al cargar el proyecto. Por favor, inténtelo de nuevo.');
    }
}

export function deleteProjectById(userId, projectId) {
    console.log('[FRONTEND] Eliminando proyecto con ID:', projectId);
    try {
        const response = fetch(`${API_BASE}/api/proyecto/eliminar`, {
            method: 'DELETE',
            headers: {
                'x-user-id': userId,
                'x-project-id': projectId
            }
        }).then(res => res.json())
        .then(data => {
            console.log('[FRONTEND] Respuesta de eliminación:', data);
            window.location.reload();
        });
    } catch (error) {
        console.error('[FRONTEND] Error al eliminar el proyecto:', error);
        alert('Error al eliminar el proyecto. Por favor, inténtelo de nuevo.');
    }
}

function formatTimestamp(ts) {
    const date = new Date(ts);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}