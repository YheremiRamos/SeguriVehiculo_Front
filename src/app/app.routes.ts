import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login.component';
import { IndexComponent } from './index/index.component';
// import { AgregarSalidaComponent } from './components/agregarar-salida/agregar-salida.component';
import { AgregarIngresoComponent } from './components/agregar-ingreso/agregar-ingreso.component';
//import { CrudEspacioParqueoComponent } from './components/crud-EspacioParqueo/crud-EspacioParqueo.component';
import { AgregarParqueosComponent } from './components/crud-EspacioParqueo/crud-EspacioParqueo.component';
import { InfoProblemasIngresoComponent } from './components/info-problemas-ingreso/info-problemas-ingreso.component';
import { AddSalidaVehicularComponent } from './components/add-salida-vehicular/add-salida-vehicular.component';


export const routes: Routes = [
    {path:"verRegistraIngreso", component:AgregarIngresoComponent },
    {path:"verEspacioParqueo", component:AgregarParqueosComponent },

    {path:"verRegistraSalida", component:AddSalidaVehicularComponent },

    {path:"verInfoProblemasIngreso", component:InfoProblemasIngresoComponent},
  
    { path: '', component: IndexComponent },
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '', pathMatch: 'full' }
  ];
  
