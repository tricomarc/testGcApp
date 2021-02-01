// Valores estáticos usados por la página visual
export const config = {
	translations: {},
	endpoints: {
		get: {
                  filtros: '/sitio/estadistica/filtros',
                  estados: '/sitio/estadistica/visual/estados',
                  visuales: '/visuales/estadisticas',
                  checklist: '/checklist/estadisticas',
                  kpi: '/kpi/dashboard',
                  comunicados: '/comunicados/estadisticas',
                  incidencias: '/incidencias/estadisticas',
                  control: '/pedidos/estadisticas',
                  vale: '/vales/estadisticas',
                  detalleKpiAreas: '/kpi/detalleareas',
                  tareas: '/tareas/estadisticas'
            },
            post: {
                  materiales: '/dashboard/vales/zonal',
                  comunicadoDetalleSucursal: '/comunicados/detallesucursal',
                  comunicadosDetalleSucursalUsuario: '/comunicados/detalleusuario',
                  visualDetalleSucursal: '/visuales/detallesucursal',
                  checklistDetalle: '/checklist/estadisticas/checklist',
                  checklistDetalleSucursal: '/checklist/estadisticas/asignaciones'
            }
      },
      extra: {}
};