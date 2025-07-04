import { AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'

export function AppHeader() {
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}
    >
      <Toolbar className="max-w-6xl mx-auto w-full">
        <Box className="flex items-center space-x-3">
          <div className="text-2xl">🌤️</div>
          <div>
            <Typography 
              variant="h6" 
              component="h1" 
              className="text-gray-800 font-bold"
            >
              Nearest Nice Weather
            </Typography>
            <Typography 
              variant="caption" 
              className="text-gray-500 block leading-none"
            >
              by PrairieAster.Ai
            </Typography>
          </div>
        </Box>

        <Box className="flex-1" />

        {/* Desktop Navigation */}
        <Box className="hidden md:flex items-center space-x-6">
          <Typography 
            variant="body2" 
            className="text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
          >
            About
          </Typography>
          <Typography 
            variant="body2" 
            className="text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
          >
            Minnesota Tourism
          </Typography>
          <Typography 
            variant="body2" 
            className="text-gray-600 hover:text-gray-800 cursor-pointer transition-colors"
          >
            API
          </Typography>
        </Box>

        {/* Mobile Menu */}
        <IconButton 
          className="md:hidden"
          sx={{ color: 'gray.600' }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}