import { Box, Typography, Container, Link } from '@mui/material'

export function AppFooter() {
  return (
    <Box 
      component="footer" 
      className="bg-gray-900 text-white mt-16"
    >
      <Container maxWidth="lg" className="py-12">
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <Box className="md:col-span-2">
            <Box className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🌤️</span>
              <Typography variant="h6" className="font-bold">
                Nearest Nice Weather
              </Typography>
            </Box>
            <Typography variant="body2" className="text-gray-400 mb-4 max-w-md">
              Connecting outdoor enthusiasts with optimal weather conditions across Minnesota. 
              Find your perfect adventure weather with precision and ease.
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              Powered by PrairieAster.Ai Weather Intelligence Platform
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box>
            <Typography variant="h6" className="mb-4 font-semibold">
              Platform
            </Typography>
            <Box className="space-y-2">
              <Link href="#" className="block text-gray-400 hover:text-white transition-colors text-sm">
                How It Works
              </Link>
              <Link href="#" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Weather Data
              </Link>
              <Link href="#" className="block text-gray-400 hover:text-white transition-colors text-sm">
                API Access
              </Link>
              <Link href="#" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Mobile App
              </Link>
            </Box>
          </Box>

          {/* Minnesota Tourism */}
          <Box>
            <Typography variant="h6" className="mb-4 font-semibold">
              Minnesota
            </Typography>
            <Box className="space-y-2">
              <Link href="#" className="block text-gray-400 hover:text-white transition-colors text-sm">
                BWCA Conditions
              </Link>
              <Link href="#" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Lake Activities
              </Link>
              <Link href="#" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Tourism Operators
              </Link>
              <Link href="#" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Seasonal Guide
              </Link>
            </Box>
          </Box>
        </Box>

        <Box className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <Typography variant="caption" className="text-gray-500">
            © 2024 PrairieAster.Ai. All rights reserved.
          </Typography>
          <Box className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-gray-500 hover:text-white transition-colors text-sm">
              Privacy
            </Link>
            <Link href="#" className="text-gray-500 hover:text-white transition-colors text-sm">
              Terms
            </Link>
            <Link href="#" className="text-gray-500 hover:text-white transition-colors text-sm">
              Contact
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}