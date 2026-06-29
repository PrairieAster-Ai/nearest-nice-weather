import React from 'react'
import { Button as MuiButton, ButtonProps, CircularProgress } from '@mui/material'

/** Props for {@link Button} — MUI `ButtonProps` plus a loading affordance. */
interface CustomButtonProps extends ButtonProps {
  /** When true, disables the button and swaps the start icon for a spinner. */
  loading?: boolean
  /** Label shown in place of `children` while `loading` is true (children show if omitted). */
  loadingText?: string
}

/**
 * Material-UI `Button` wrapper that adds an inline loading state: a
 * `CircularProgress` start icon and optional `loadingText`, while disabling the
 * button so it can't be double-submitted. Forwards every other MUI `ButtonProps`.
 *
 * @example
 * ```tsx
 * <Button variant="contained" loading={submitting} loadingText="Saving…" onClick={save}>
 *   Save
 * </Button>
 * ```
 */
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
