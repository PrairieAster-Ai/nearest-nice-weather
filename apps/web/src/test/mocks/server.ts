import { setupServer } from 'msw/node'
import { weatherHandlers } from './handlers/weather'

export const server = setupServer(...weatherHandlers)