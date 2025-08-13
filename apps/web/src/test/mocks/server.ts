import { setupServer } from 'msw/node'
import { weatherHandlers } from './handlers/weather'
import { apiHandlers } from './handlers/api'

export const server = setupServer(...weatherHandlers, ...apiHandlers)