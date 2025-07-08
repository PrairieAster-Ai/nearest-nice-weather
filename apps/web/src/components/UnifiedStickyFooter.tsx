import { Box, Typography, Container, Link } from '@mui/material'

export function UnifiedStickyFooter() {
  return (
    <Box 
      component="footer" 
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: '#f8f4ff', // Light purple background
        borderTop: '2px solid #e0d4f7', // Purple border
        zIndex: 1002, // Above map and FABs
        backdropFilter: 'blur(8px)',
        boxShadow: '0 -4px 20px rgba(117, 99, 168, 0.15)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Main Footer Content */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 2 }}>
          
          {/* Brand Section - Header elements merged */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <img 
              src="/aster-official.svg" 
              alt="Nearest Nice Weather" 
              style={{ height: 32, width: 32 }}
            />
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                color: '#7563A8', 
                lineHeight: 1.2,
                mb: 0.5
              }}>
                Nearest Nice Weather
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#7fa4cf', 
                lineHeight: 1,
                display: 'block'
              }}>
                by PrairieAster.Ai
              </Typography>
            </Box>
          </Box>

          {/* Quick Links */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link 
              href="#" 
              sx={{ 
                color: '#7563A8', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                '&:hover': { color: '#5a4a87' }
              }}
            >
              How It Works
            </Link>
            <Link 
              href="#" 
              sx={{ 
                color: '#7563A8', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                '&:hover': { color: '#5a4a87' }
              }}
            >
              Weather Data
            </Link>
            <Link 
              href="#" 
              sx={{ 
                color: '#7563A8', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                '&:hover': { color: '#5a4a87' }
              }}
            >
              BWCA Conditions
            </Link>
            <Link 
              href="#" 
              sx={{ 
                color: '#7563A8', 
                textDecoration: 'none', 
                fontSize: '0.875rem',
                '&:hover': { color: '#5a4a87' }
              }}
            >
              API Access
            </Link>
          </Box>

          {/* Right Section - Legal & Contact */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center', 
            ml: { md: 'auto' },
            flexWrap: 'wrap'
          }}>
            <Link 
              href="#" 
              sx={{ 
                color: '#666', 
                textDecoration: 'none', 
                fontSize: '0.75rem',
                '&:hover': { color: '#333' }
              }}
            >
              Privacy
            </Link>
            <Link 
              href="#" 
              sx={{ 
                color: '#666', 
                textDecoration: 'none', 
                fontSize: '0.75rem',
                '&:hover': { color: '#333' }
              }}
            >
              Terms
            </Link>
            <Link 
              href="#" 
              sx={{ 
                color: '#666', 
                textDecoration: 'none', 
                fontSize: '0.75rem',
                '&:hover': { color: '#333' }
              }}
            >
              Contact
            </Link>
          </Box>
        </Box>

        {/* Bottom Copyright */}
        <Box sx={{ 
          borderTop: '1px solid #e0d4f7', 
          pt: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Typography variant="caption" sx={{ color: '#666', textAlign: 'center' }}>
            © 2024 PrairieAster.Ai • Connecting outdoor enthusiasts with optimal weather conditions across Minnesota
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}