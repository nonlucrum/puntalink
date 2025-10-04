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