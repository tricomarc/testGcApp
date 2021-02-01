import { IndexPage } from "./pages/index";
import { IncidentsBranchOfficePage } from "./pages/incidents/branch-office/incidents-branch-office";
import { DashboardPage } from "./pages/dashboard/tienda/dashboard";
import { IncidentsAdminPage } from "./pages/incidents/admin/incidents-admin";
import { EstadisticasPage } from "./pages/dashboard/zonal/estadisticas";
import { VisualPage } from "./pages/visual/branch-office/visual";
import { KpiRipleyPage } from "./pages/kpi/custom/ripley/kpi-ripley";
import { MaterialsPage } from './pages/materials/materials';
import { TasksBranchOfficePage } from './pages/tasks/branch-office/tasks-branch-office';
import { FilesPage } from './pages/files/files';
import { ComunicadosZonalPage } from "./pages/comunicados/zonal/comunicados-zonal";
import { ComunicadosTiendaPage } from "./pages/comunicados/tienda/comunicados-tienda";
import { VisitaPage } from "./pages/visita/visita";
import { VisualZonalPage } from './pages/visual/zonal/visual-zonal';
import { ChatPage } from "./pages/chat/chat";
import { KnowledgeBasePage } from './pages/knowledge-base/knowledge-base';
import { KpiColgramPage } from './pages/kpi/custom/colgram/kpi-colgram';
import { KpiMaicaoPage } from "./pages/kpi/custom/maicao/kpi-maicao";
import { IndexOperaappPage } from './pages/index/custom/operaapp/index-operaapp';
import { IndicatorDepartmentsRipleyPage } from './pages/kpi/custom/ripley/indicator-departments-ripley/indicator-departments-ripley';
import { KpiTricotPage } from './pages/kpi/custom/tricot/kpi-tricot';
import { VerRutasPage } from './pages/ver-rutas/ver-rutas';

import { NotificationsPage } from './pages/notifications/notifications';
import { MiGestionPage } from "./pages/mi-gestion/mi-gestion";

/* Checklist viejo */
import { ChecklistTiendaPage } from "./pages/checklist/tienda/checklist-tienda";
import { ChecklistZonalPage } from "./pages/checklist/zonal/checklist-zonal";
import { SeguimientoValePage } from "./pages/seguimiento-vale/seguimiento-vale";

/* Checklist nuevo */
import { ChecklistsBranchOfficePage } from './pages/checklists/branch-office/checklists-branch-office';
import { ChecklistsZonalPage } from "./pages/checklists/zonal/checklists-zonal";
import { LeanPageModule } from "./pages/lean/lean.module";
import { TaskManagerPage } from "./pages/task-manager/task-manager";

export const globalConfig = {

    
    isBrowser: false,  // True si la app se ejecuta en un navegador
    isTest: false, // True si la app se ejecuta en modo test
    testBuild: false, // True para probar una actualización de Ionic (Se salta la comprobación de la API)
    login: {
        usuario: "",
        clave: ""
    },
    
    version: "7.6.1",
    //TODO: IndexPage solo funciona como string
    modules: [
        //Para clientes sin estadisticas, activar 1 y 3, con estadisticas activar 4.
        { page: EstadisticasPage, names: ['dashboard'], charges: ['zonal', 'country', 'admin'] },
        //{ page: "IndexPage", names: ['Inicio', 'Home', 'Estadísticas', 'Estadisticas', 'Estadística'], charges: ['branch-office', 'zonal', 'country'] },
        { page: "IndexPage", names: ['inicio'], charges: ['zonal', 'country'] },
        { page: DashboardPage, names: ['inicio'], charges: ['branch-office'] },
        { page: VisualPage, names: ['visual'], charges: ['branch-office'], customIcon: 'icon-visualapp', customImage: 'custom/operaapp/zonal/visual.png' },
        { page: VisualZonalPage, names: ['visual'], charges: ['zonal', 'country'], customIcon: 'icon-visualapp', customImage: 'custom/operaapp/zonal/visual.png' },

        /* Checklist viejo */
        { page: ChecklistTiendaPage, names: ['checklist'], charges: ['branch-office'], customIcon: 'icon-checklist', customImage: 'custom/operaapp/zonal/checklist.png' },
        { page: ChecklistZonalPage, names: ['checklist'], charges: ['zonal', 'country'], customIcon: 'icon-checklist', customImage: 'custom/operaapp/zonal/checklist.png' },

        { page: IncidentsBranchOfficePage, names: ['incidencia'], charges: ['branch-office'], customIcon: 'icon-incidencias', customImage: 'custom/operaapp/zonal/incidencias.png' },
        { page: IncidentsAdminPage, names: ['incidencia'], charges: ['admin'], customIcon: 'icon-incidencias', customImage: 'custom/operaapp/zonal/incidencias.png' },
        { page: ComunicadosTiendaPage, names: ['com', 'premios'], charges: ['branch-office'] },
        { page: ComunicadosZonalPage, names: ['com', 'premios'], charges: ['zonal', 'country'] },
        { page: KpiRipleyPage, names: ['kpi'], charges: ['zonal', 'branch-office', 'country'], companies: ['elige chile', 'unete', 'elige peru', 'modo r', 'elige br', 'gc app', 'johnson'] },
        { page: KpiTricotPage, names: ['kpi'], charges: ['zonal', 'branch-office', 'country'], companies: ['informat', 'oneapp', 'sermas'] },
        { page: KpiColgramPage, names: ['kpi'], charges: ['zonal'], companies: ['colgram', 'kolo', 'new colgram'] },
        { page: KpiMaicaoPage, names: ['kpi'], charges: ['zonal', 'branch-office', 'country'], companies: ['360m', 'maicao'] },
        { page: MaterialsPage, names: ['materiales'], charges: ['branch-office'], customIcon: 'icon-recepcion', customImage: 'custom/operaapp/zonal/recepcion.png' },
        { page: TasksBranchOfficePage, names: ['tarea'], charges: ['branch-office', 'country'] },
        { page: FilesPage, names: ['cms'], charges: ['branch-office', 'zonal', 'country'] },
        { page: VisitaPage, names: ['visita', 'control'], charges: ['zonal', 'country'] },
        { page: ChatPage, names: ['chat'], charges: ['zonal', 'country', 'branch-office'] },
        { page: KnowledgeBasePage, names: ['base'], charges: ['zonal', 'country', 'branch-office'] },
        { page: IndexOperaappPage, names: ['inicio'], charges: ['branch-office'], companies: ['opera app'] },
        { page: IndicatorDepartmentsRipleyPage, names: ['tacómetro'], charges: ['zonal', 'branch-office', 'country'], companies: ['elige chile', 'unete', 'elige peru', 'modo r', 'elige br', 'gc app', 'oneapp', 'johnson'] },
        { page: NotificationsPage, names: ['notificacion'], charges: ['zonal', 'branch-office', 'country'] },
        { page: MiGestionPage, names: ['miGestion'], charges: ['zonal', 'branch-office', 'country'] },
        { page: VisualPage, names: ['tareas_visual'], charges: ['branch-office'] },
        { page: SeguimientoValePage, names: ['vale'], charges: ['branch-office'] },
        { page: VerRutasPage, names: ['routes'], charges: ['zonal', 'country'] },
        { page: LeanPageModule, names: [ 'lean' ], charges: ['branch-office'] },
        { page: TaskManagerPage, names: [ 'taskmanager' ], charges: ['zonal', 'country', 'branch-office']}
    ]
};
 
/* ionic cordova plugin add cordova-plugin-ionic --save --variable APP_ID="5c60e66e" --variable CHANNEL_NAME="Master" --variable UPDATE_METHOD="none" */