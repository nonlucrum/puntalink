import { Request, Response } from 'express';
import { calcularPaneles } from '../services/panelesService';
import { generarInformePaneles } from '../services/pdfService';
import { getProjectById } from '../models/Project';

export async function informePaneles(req: Request, res: Response) {
  try {
    // 1. Extraer explícitamente reporteMacizos del body
    const { 
      paneles, 
      projectId, 
      userId, 
      creadorProyecto, 
      version, 
      projectInfo: projectInfoBody,
      tablaMuertos,
      reporteMacizos // <--- ESTO ES LO QUE FALTABA O FALLABA
    } = req.body;
    
    console.log('[pdfController] Recibido request PDF.');
    console.log(`[pdfController] Paneles: ${paneles?.length}`);
    console.log(`[pdfController] Macizos recibidos: ${reporteMacizos ? reporteMacizos.length : 'UNDEFINED'}`);

    if (!Array.isArray(paneles) || paneles.length === 0) {
      return res.status(400).json({ ok: false, error: "Faltan los paneles." });
    }
    
    // Procesamiento de paneles
    const resultados = calcularPaneles(paneles);
    
    const resultadosEnriquecidos = resultados.map((resultado, index) => ({
      ...resultado,
      ...paneles[index], 
      grosor_mm: paneles[index]?.grosor ? paneles[index].grosor * 1000 : undefined, 
      area_m2: paneles[index]?.area
    }));
    
    // Info del proyecto
    let finalProjectInfo = undefined;
    if (projectId && userId) {
      try {
        const project = await getProjectById(projectId, userId);
        if (project) {
          finalProjectInfo = {
            nombre: project.nombre,
            empresa: project.empresa,
            tipo_muerto: project.tipo_muerto,
            vel_viento: project.vel_viento,
            temp_promedio: project.temp_promedio,
            presion_atmo: project.presion_atmo,
            creadorProyecto: creadorProyecto || 'No especificado',
            version: version || '1.0'
          };
        }
      } catch (error) {
        console.log('[pdfController] Error obteniendo proyecto:', error);
      }
    }
    
    // Merge info proyecto
    if (projectInfoBody) {
      finalProjectInfo = {
        ...(finalProjectInfo || {}),
        ...projectInfoBody,
        creadorProyecto: creadorProyecto || projectInfoBody.creadorProyecto || finalProjectInfo?.creadorProyecto || 'No especificado',
        version: version || projectInfoBody.version || finalProjectInfo?.version || '1.0'
      };
    }
    
    const userInfo = {
      name: creadorProyecto || 'Usuario',
      email: '' 
    };

    // 2. PASAR reporteMacizos AL SERVICIO (6to argumento)
    const informeBuffer = await generarInformePaneles(
      resultadosEnriquecidos, 
      finalProjectInfo,
      tablaMuertos,
      undefined, 
      userInfo,
      reporteMacizos // <--- AQUÍ SE PASAN LOS DATOS
    );
    
    console.log(`[pdfController] PDF generado exitosamente, tamaño: ${informeBuffer.length} bytes`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="informe_paneles.pdf"');
    res.send(informeBuffer);

  } catch (err: any) {
    console.error('[pdfController] Error crítico:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}