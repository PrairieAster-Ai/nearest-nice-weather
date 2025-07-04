import React from 'react'
import { Button as MuiButton, ButtonProps, CircularProgress } from '@mui/material'

interface CustomButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

export const Button: React.FC<CustomButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}) => {
  return (
    <MuiButton
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} /> : props.startIcon}
      {...props}
    >
      {loading && loadingText ? loadingText : children}
    </MuiButton>
  )
}

export default Button