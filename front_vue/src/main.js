import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VDataTable } from 'vuetify/labs/components'
import { VTreeview } from 'vuetify/labs/components'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components: {
    ...components,
    VDataTable,
    VTreeview
  },
  directives,
  theme: {
    defaultTheme: 'light'
  }
})

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.mount('#app')