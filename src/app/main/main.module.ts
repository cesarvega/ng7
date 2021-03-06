import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { FuseSharedModule } from '@fuse/shared.module';
import { UsersComponent } from './users/users.component';
import { UsersModule } from './users/users.module';
import { ProfileComponent } from './profile/profile.component';
import { ProfileModule } from './profile/profile.module';
import { InventoryComponent } from './inventory/inventory.component';
import { OrdersComponent } from './orders/orders.component';
import { PaymentComponent } from './payment/payment.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PaymentModule } from './payment/payment.module';
import { AuthGuard } from './login-register/service/auth-guard.service';
import { AuthGuardService } from './login-register/service/auth.service';



const routes = [
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'inventory',
    component: InventoryComponent
  },
  {
    path: 'orders',
    component: OrdersComponent
  },
  {
    path: 'payment',
    component: PaymentComponent
  },
  {
    path: 'schedule',
    component: ScheduleComponent
  },
  {
    path: 'subscription',
    component: SubscriptionComponent
  },
  // {
  //   path: 'items',
  //   loadChildren: './items/items.module#ItemsModule'
  // },
  {
    path: 'login',
    loadChildren: './login-register/login-register.module#LoginRegisterModule'
  },
  {
    path: 'change-password',
    loadChildren: './login-register/login-register.module#LoginRegisterModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'unsubscribe',
    loadChildren: './login-register/login-register.module#LoginRegisterModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'items',
    loadChildren: './surveys/surveys.module#SurveysModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'faq',
    loadChildren: './login-register/login-register.module#LoginRegisterModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'calendar',
    loadChildren: './calendar/calendar.module#CalendarModule',
    // canActivate: [AuthGuard]
  },
  // {
  //   path: 'form',
  //   loadChildren: './dynamic-profile/dynamic-profile.module#DynamicProfileModule',
  //   // canActivate: [AuthGuard]
  // },
  {
    path: '**',
    redirectTo: 'items'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),

    TranslateModule,

    FuseSharedModule,

    UsersModule,
    ProfileModule,
    InventoryModule,
    OrdersModule,
    PaymentModule,
    ScheduleModule,
    SubscriptionModule
  ],
  providers: [
    AuthGuard, AuthGuardService
  ],
})
export class MainModule { }
