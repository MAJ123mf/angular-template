import { Routes } from '@angular/router';
import { ParcelFormComponent } from './components/forms/parcel-form/parcel-form.component';
import { RoadFormComponent } from './components/forms/road-form/road-form.component';
import { AddressFormComponent } from './components/forms/address-form/address-form.component';
import { ParcelTableComponent } from './components/tables/parcel-table/parcel-table.component';
import { RoadTableComponent } from './components/tables/road-table/road-table.component';
import { AddressTableComponent } from './components/tables/address-table/address-table.component';
import { MapComponent } from './components/map/map.component';
import { LoginFormComponent } from './components/forms/login-form/login-form.component';
import { LogoutFormComponent } from './components/forms/logout-form/logout-form.component';
import { DrawParcelComponent } from './components/draw-parcel/draw-parcel.component';

export const routes: Routes = [
    {path: '', redirectTo: '/home', pathMatch: 'full'},
    {path: 'form-parcel', component:ParcelFormComponent},
    {path: 'form-road', component:RoadFormComponent},
    {path: 'form-address', component:AddressFormComponent},
    {path: 'table-parcel', component:ParcelTableComponent},
    {path: 'table-road', component:RoadTableComponent},
    {path: 'table-address', component:AddressTableComponent},
    {path: 'map', component:MapComponent},
    {path: 'login-form', component:LoginFormComponent},
    {path: 'logout-form', component:LogoutFormComponent},
    {path: 'draw-parcel', component:DrawParcelComponent},  
];
