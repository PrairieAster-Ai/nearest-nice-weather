"use client"

import { useState } from "react"
import { Fab, SpeedDial, SpeedDialAction, SpeedDialIcon, Backdrop } from "@mui/material"
import { Grid3X3, List, Layers, LayoutGrid } from "lucide-react"

interface FabLayoutSwitcherProps {
  layoutMode: 'grid' | 'compact' | 'vertical'
  onLayoutChange: (mode: 'grid' | 'compact' | 'vertical') => void
  className?: string
}

export function FabLayoutSwitcher({ layoutMode, onLayoutChange, className = '' }: FabLayoutSwitcherProps) {
  const [open, setOpen] = useState(false)

  const handleClose = () => setOpen(false)
  const handleOpen = () => setOpen(true)

  const actions = [
    {
      icon: <Grid3X3 className="w-5 h-5" />,
      name: 'Grid Layout',
      action: 'grid' as const,
      active: layoutMode === 'grid'
    },
    {
      icon: <Layers className="w-5 h-5" />,
      name: 'Compact Layout', 
      action: 'compact' as const,
      active: layoutMode === 'compact'
    },
    {
      icon: <List className="w-5 h-5" />,
      name: 'Vertical Layout',
      action: 'vertical' as const,
      active: layoutMode === 'vertical'
    }
  ]

  const currentIcon = actions.find(action => action.active)?.icon || <LayoutGrid className="w-5 h-5" />

  return (
    <>
      {/* Backdrop */}
      <Backdrop 
        open={open} 
        sx={{ 
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }} 
      />
      
      {/* Speed Dial FAB */}
      <SpeedDial
        ariaLabel="Layout Options"
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1001,
          '& .MuiFab-primary': {
            backgroundColor: '#7563A8',
            color: 'white',
            '&:hover': {
              backgroundColor: '#614F94',
            },
          },
          '& .MuiSpeedDialAction-fab': {
            backgroundColor: 'white',
            color: '#7563A8',
            border: '2px solid #8DA8CC',
            '&:hover': {
              backgroundColor: '#F3F7FB',
              borderColor: '#7563A8',
            },
          },
        }}
        icon={<SpeedDialIcon icon={currentIcon} />}
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        direction="down"
        FabProps={{
          size: 'medium',
          sx: {
            width: 48,
            height: 48,
          }
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.action}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              onLayoutChange(action.action)
              handleClose()
            }}
            sx={{
              backgroundColor: action.active ? '#7563A8' : 'white',
              color: action.active ? 'white' : '#7563A8',
              '&:hover': {
                backgroundColor: action.active ? '#614F94' : '#F3F7FB',
              }
            }}
            FabProps={{
              size: 'small',
            }}
          />
        ))}
      </SpeedDial>
    </>
  )
}