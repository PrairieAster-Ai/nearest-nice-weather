import React from 'react'
import {
  Box,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material'

export interface WeatherFilter {
  temperature: string
  precipitation: string
  wind: string
}

interface WeatherFiltersProps {
  filters: WeatherFilter
  onChange: (category: keyof WeatherFilter, value: string) => void
  disabled?: boolean
}

export const WeatherFilters: React.FC<WeatherFiltersProps> = ({
  filters,
  onChange,
  disabled = false,
}) => {
  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Weather Preferences
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 3 }}>
        <FormControl component="fieldset" sx={{ flex: 1 }} disabled={disabled}>
          <FormLabel component="legend">Temperature</FormLabel>
          <RadioGroup
            value={filters.temperature}
            onChange={(e) => onChange('temperature', e.target.value)}
          >
            <FormControlLabel value="warm" control={<Radio />} label="Warm (70°F+)" />
            <FormControlLabel value="mild" control={<Radio />} label="Mild (50-70°F)" />
            <FormControlLabel value="cool" control={<Radio />} label="Cool (Below 50°F)" />
          </RadioGroup>
        </FormControl>

        <FormControl component="fieldset" sx={{ flex: 1 }} disabled={disabled}>
          <FormLabel component="legend">Precipitation</FormLabel>
          <RadioGroup
            value={filters.precipitation}
            onChange={(e) => onChange('precipitation', e.target.value)}
          >
            <FormControlLabel value="none" control={<Radio />} label="No rain/snow" />
            <FormControlLabel value="light" control={<Radio />} label="Light rain okay" />
            <FormControlLabel value="any" control={<Radio />} label="Any weather" />
          </RadioGroup>
        </FormControl>

        <FormControl component="fieldset" sx={{ flex: 1 }} disabled={disabled}>
          <FormLabel component="legend">Wind</FormLabel>
          <RadioGroup
            value={filters.wind}
            onChange={(e) => onChange('wind', e.target.value)}
          >
            <FormControlLabel value="calm" control={<Radio />} label="Calm (0-5 mph)" />
            <FormControlLabel value="light" control={<Radio />} label="Light breeze (5-15 mph)" />
            <FormControlLabel value="windy" control={<Radio />} label="Windy okay (15+ mph)" />
          </RadioGroup>
        </FormControl>
      </Box>
    </Paper>
  )
}

export default WeatherFilters