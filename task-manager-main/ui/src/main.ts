import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import App from './App.vue'
// import TaskBoardComp from './views/TaskBoardComp.vue'
import TaskBoardDisplay from './views/TaskBoardDisplay.vue'
import StatusScreen from './views/StatusScreen.vue'
import TeamsScreen from './views/TeamsScreen.vue'

const routes = [
  {
    path: "/",
    component: StatusScreen,
  },
  {
    path: "/taskboards",
    component: TaskBoardDisplay,
    // props: ({ params: {memberId}}: { params: { memberId: string }}) => ({ memberId }),

  },
  {
    path: "/teams",
    component: TeamsScreen,
  },
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

createApp(App)
	.use(BootstrapVue as any)
	.use(BootstrapVueIcons as any)
	.use(router)
	.mount('#app')

