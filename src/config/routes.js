import React from "react";
import CustomFields from "@/components/pages/CustomFields";
import Settings from "@/components/pages/Settings";
import Contacts from "@/components/pages/Contacts";
import Tasks from "@/components/pages/Tasks";
import ContactDetail from "@/components/pages/ContactDetail";
import Dashboard from "@/components/pages/Dashboard";
import Pipeline from "@/components/pages/Pipeline";
export const routes = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    component: Dashboard
  },
contacts: {
    id: 'contacts',
    label: 'Contacts',
    path: '/contacts',
    icon: 'Users',
    component: Contacts
  },
  contactDetail: {
    id: 'contactDetail',
    label: 'Contact Detail',
    path: '/contacts/:id',
    icon: 'User',
    component: ContactDetail
  },
  customFields: {
    id: 'customFields',
    label: 'Custom Fields',
    path: '/custom-fields',
    icon: 'Settings',
    component: CustomFields
  },
  pipeline: {
    id: 'pipeline',
    label: 'Pipeline',
    path: '/pipeline',
    icon: 'TrendingUp',
    component: Pipeline
  },
  tasks: {
    id: 'tasks',
    label: 'Tasks',
    path: '/tasks',
    icon: 'CheckSquare',
    component: Tasks
  },
  emailIntegration: {
    id: 'emailIntegration',
    label: 'Email Integration',
    path: '/email-integration',
    icon: 'Mail',
    component: () => import('@/components/pages/EmailIntegration').then(m => m.default)
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'Settings',
    component: Settings
  }
};

export const routeArray = Object.values(routes);
export default routes;