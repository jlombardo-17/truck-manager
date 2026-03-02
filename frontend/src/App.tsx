import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import './App.css'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [token, setToken] = useState(localStorage.getItem('tm_token') || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [me, setMe] = useState<Record<string, unknown> | null>(null)

  const canSubmit = useMemo(() => email.length > 4 && password.length >= 6, [email, password])

  const onRegister = async () => {
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo registrar el usuario')
      }

      setToken(data.accessToken)
      localStorage.setItem('tm_token', data.accessToken)
      setMessage('Usuario registrado correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const onLogin = async () => {
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Credenciales invalidas')
      }

      setToken(data.accessToken)
      localStorage.setItem('tm_token', data.accessToken)
      setMessage('Login exitoso')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const onMe = async () => {
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo obtener el perfil')
      }

      setMe(data)
      setMessage('Perfil obtenido correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const onLogout = () => {
    localStorage.removeItem('tm_token')
    setToken('')
    setMe(null)
    setMessage('Sesion cerrada')
    setError('')
  }

  const onUseDemoUser = () => {
    setEmail('admin@truckmanager.local')
    setPassword('admin123')
    setFirstName('Admin')
    setLastName('Demo')
    setMessage('Credenciales demo cargadas')
    setError('')
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <Box className="app-home">
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant="h4">Truck Manager</Typography>
                    <Typography variant="body1">Prueba rapida del modulo de autenticacion</Typography>

                    {error && <Alert severity="error">{error}</Alert>}
                    {message && <Alert severity="success">{message}</Alert>}

                    <TextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Nombre (opcional)"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Apellido (opcional)"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      fullWidth
                    />

                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" color="secondary" onClick={onUseDemoUser}>
                        Usar Demo
                      </Button>
                      <Button variant="contained" onClick={onRegister} disabled={!canSubmit}>
                        Register
                      </Button>
                      <Button variant="outlined" onClick={onLogin} disabled={!canSubmit}>
                        Login
                      </Button>
                      <Button variant="outlined" onClick={onMe} disabled={!token}>
                        /auth/me
                      </Button>
                      <Button variant="text" onClick={onLogout} disabled={!token}>
                        Logout
                      </Button>
                    </Stack>

                    <Typography variant="body2">
                      Token actual: {token ? `${token.slice(0, 24)}...` : 'sin token'}
                    </Typography>

                    {me && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1">Usuario autenticado</Typography>
                        <pre>{JSON.stringify(me, null, 2)}</pre>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              </Box>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
