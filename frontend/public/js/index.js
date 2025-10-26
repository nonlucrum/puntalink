const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:4008"   // dev backend
    : "";                       // production (relative)

export async function createProject(uiElements, callbacks, globalVars) {
    try {
        console.log('[FRONTEND] Creando nuevo proyecto con datos:', globalVars.projectData);

        // Enviar datos al backend
        await fetch(`${API_BASE}/api/proyecto/crear`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(globalVars.projectData)
        })
        .then(res => res.json())
        .then(data => {
            console.log("[FRONTEND] Full response:", data.new_project);
            // Guardar los datos en localStorage para uso posterior
            localStorage.setItem('projectConfig', JSON.stringify(data.new_project));
        })
        
        // Redirigir al dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('[FRONTEND] Error al crear el proyecto:', error);
        alert('Error al crear el proyecto. Por favor, inténtelo de nuevo.');
    }
}

export async function loadPreviousProjects() {
    console.log('[FRONTEND] Cargando proyectos anteriores...');

    try {
        const response = await fetch(`${API_BASE}/api/proyecto/listar`, {
            method: 'GET',
            headers: {
                'x-user-id': '1'  // Reemplaza con el ID real del usuario
            }
        });

        const projectList = document.getElementById('projectList');
        const data = await response.json();
        console.log('[FRONTEND] Proyectos obtenidos:', data.proyectos);
        // Limpiar la lista actual
        projectList.innerHTML = '';
        // Rellenar la lista con los proyectos obtenidos
        let htmlDetalle = '';
        data.proyectos.forEach(project => {
            htmlDetalle += `
                <button class="project-card">
                    <div style="display: flex; flex-direction: row">
                    <svg width="40" height="77">
                `;
            if (project.tipo_muerto === 'Cilindrico') {
                htmlDetalle += `<circle cx="0" cy="38.5" r="30" stroke="#ccc" stroke-width="3" fill="transparent" />`;
            } else if (project.tipo_muerto === 'Corrido') {
                htmlDetalle += `<rect x="-30" y="8.5" width="60" height="60" stroke="#ccc" stroke-width="3" fill="transparent" />`;
            } else if (project.tipo_muerto === 'Triangular') {
                htmlDetalle += `<polygon points="-30,12 30,12 0,64" style="fill:transparent;stroke:#ccc;stroke-width:3" />`;
            }
            htmlDetalle += `
                    </svg>
                    <div class="project-card-title">
                        <h3>${project.nombre}</h3>
                        <h4>${project.empresa}</h4>
                        <text class="project-card-var">Muerto ${project.tipo_muerto}</text>
                        <text class="project-card-var">28/10/2025 18:30</text>
                    </div>
                    </div>
                    <div class="project-card-info">
                    <text class="project-card-var">Hidalgo, México</text>
                    <text class="project-card-var">${project.vel_viento} km/h</text>
                    <text class="project-card-var">${project.temp_promedio} °C</text>
                    <text class="project-card-var">${project.presion_atmo} mmHg</text>
                    </div>
                </button>
            `;
            /* const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectList.appendChild(option); */
        projectList.innerHTML = htmlDetalle;
        });
    } catch (error) {
        console.error('[FRONTEND] Error al cargar los proyectos anteriores:', error);
        alert('Error al cargar los proyectos anteriores. Por favor, inténtelo de nuevo.');
    }
}