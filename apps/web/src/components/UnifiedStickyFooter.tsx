import { Box, Typography } from '@mui/material'

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
        zIndex: 1004, // Above map container (1003) and FABs (1000)
        backdropFilter: 'blur(8px)',
        boxShadow: '0 -4px 20px rgba(117, 99, 168, 0.15)',
        margin: 0,
        padding: 0,
      }}
    >
      <Box sx={{ 
        height: { xs: 'max(5.6vh, 42px)', sm: 'max(6vh, 50px)', md: 'max(5vh, 45px)' }, // iPhone reduced by 30%
        minHeight: { xs: '32px', sm: '45px', md: '45px' }, // iPhone min reduced by 30%
        maxHeight: { xs: '56px', sm: '80px', md: '80px' }, // iPhone max reduced by 30%
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        px: 0,
        py: 0,
        margin: 0
      }}>
        {/* Tight Brand Layout - Purple Aster fills footer height, pinned to left */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          height: '100%',
          gap: 0.5, // Minimal gap between aster and text
          pl: 1, // Small padding from left edge only
          pr: 0 // No right padding to stay left-aligned
        }}>
          
          {/* Purple Aster - Full height, touching top/bottom */}
          <Box sx={{ 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <img 
              src="/aster-official.svg" 
              alt="Nearest Nice Weather" 
              style={{ 
                height: 'calc(100% - 4px)', // Nearly full height with 2px margin top/bottom
                width: 'auto', // Maintain aspect ratio
                maxWidth: '60px' // Reasonable max width
              }}
            />
          </Box>
          
          {/* Text Block - Scales with footer, no flex-grow to avoid centering */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0 // Allow text to shrink
          }}>
            <Typography sx={{ 
              fontWeight: 'bold', 
              color: '#7563A8', 
              lineHeight: 1.1,
              fontSize: { 
                xs: 'clamp(0.63rem, 2.1vw, 0.77rem)', // iPhone reduced by 30%
                sm: 'clamp(1rem, 2.5vw, 1.2rem)',
                md: 'clamp(1.1rem, 2vw, 1.3rem)'
              }
            }}>
              Nearest Nice Weather
            </Typography>
            <Typography sx={{ 
              color: '#7fa4cf', 
              lineHeight: 1,
              fontSize: { 
                xs: 'clamp(0.49rem, 1.4vw, 0.56rem)', // iPhone reduced by 30%
                sm: 'clamp(0.75rem, 1.8vw, 0.85rem)',
                md: 'clamp(0.8rem, 1.5vw, 0.9rem)'
              },
              mt: 0.2
            }}>
              by PrairieAster.Ai
            </Typography>
          </Box>
          
          {/* MVP Plan Link */}
          <Box sx={{ 
            ml: 1.5, // Space from text
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}>
            <Box 
              component="a"
              href="/presentation/index-reveal.html"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: '#7563A8', 
                textDecoration: 'none',
                fontSize: { 
                  xs: 'clamp(0.56rem, 1.8vw, 0.67rem)', // Slightly smaller than main text
                  sm: 'clamp(0.85rem, 2.2vw, 1rem)',
                  md: 'clamp(0.95rem, 1.8vw, 1.1rem)'
                },
                fontWeight: 'medium',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                border: '1px solid #e0d4f7',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(117, 99, 168, 0.1)',
                  borderColor: '#7563A8',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              MVP Plan
            </Box>
          </Box>
        </Box>

      </Box>
    </Box>
  )
}