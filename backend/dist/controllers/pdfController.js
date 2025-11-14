"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.informePaneles = informePaneles;
const panelesService_1 = require("../services/panelesService");
const pdfService_1 = require("../services/pdfService");
const Project_1 = require("../models/Project");
async function informePaneles(req, res) {
    try {
        const { paneles, projectId, userId, creadorProyecto, version } = req.body;
        if (!Array.isArray(paneles) || paneles.length === 0) {
            return res.status(400).json({ ok: false, error: "Faltan los paneles." });
        }
        const resultados = (0, panelesService_1.calcularPaneles)(paneles);
        // Enriquecer los resultados con información original de los paneles
        const resultadosEnriquecidos = resultados.map((resultado, index) => ({
            ...resultado,
            grosor_mm: paneles[index]?.grosor ? paneles[index].grosor * 1000 : undefined, // convertir a mm
            area_m2: paneles[index]?.area
        }));
        // Obtener información del proyecto si se proporciona
        let projectInfo = undefined;
        if (projectId && userId) {
            try {
                const project = await (0, Project_1.getProjectById)(projectId, userId);
                if (project) {
                    projectInfo = {
                        nombreProyecto: project.nombre,
                        empresaConstructora: project.empresa,
                        tipoMuerto: project.tipo_muerto,
                        velViento: project.vel_viento,
                        tempPromedio: project.temp_promedio,
                        presionAtm: project.presion_atmo,
                        creadorProyecto: creadorProyecto || 'No especificado',
                        version: version || '1.0'
                    };
                }
            }
            catch (error) {
                console.log('[pdfController] No se pudo obtener información del proyecto:', error);
            }
        }
        // También permitir pasar la información directamente en el body
        if (!projectInfo && req.body.projectInfo) {
            projectInfo = {
                ...req.body.projectInfo,
                creadorProyecto: creadorProyecto || req.body.projectInfo.creadorProyecto || 'No especificado',
                version: version || req.body.projectInfo.version || '1.0'
            };
        }
        const informeBuffer = await (0, pdfService_1.generarInformePaneles)(resultadosEnriquecidos, projectInfo);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="informe_paneles.pdf"');
        res.send(informeBuffer);
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
}
