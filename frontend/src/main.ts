import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { DefaultApolloClient } from '@vue/apollo-composable'

import App from './App.vue'
import { apolloClient } from './graphql/apollo'

const app = createApp(App)

app.use(createPinia())

// Provide Apollo client globally
app.provide(DefaultApolloClient, apolloClient)

app.mount('#app')
