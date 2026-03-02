import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Alert, Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import './App.css'

type Camion = {
  id: number
  patente: string
  marca: string
  modelo: string
  anio: number
  estado: string
  odometroKm: number
}

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
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [patente, setPatente] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anio, setAnio] = useState('')

  const canCreateCamion = useMemo(
    () => patente.trim().length >= 3 && marca.trim().length >= 2 && modelo.trim().length >= 2 && Number(anio) >= 1950,
    [patente, marca, modelo, anio],
  )

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

  const onLoadCamiones = async () => {
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/camiones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo cargar camiones')
      }

      setCamiones(data)
      setMessage(`Camiones cargados: ${data.length}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const onCreateCamion = async () => {
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/camiones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patente,
          marca,
          modelo,
          anio: Number(anio),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'No se pudo crear el camion')
      }

      setMessage(`Camion creado: ${data.patente}`)
      setPatente('')
      setMarca('')
      setModelo('')
      setAnio('')
      await onLoadCamiones()
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

                    <Divider />

                    <Typography variant="h6">Modulo Camiones (MVP)</Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label="Patente"
                        value={patente}
                        onChange={(e) => setPatente(e.target.value.toUpperCase())}
                        size="small"
                      />
                      <TextField label="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} size="small" />
                      <TextField label="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} size="small" />
                      <TextField label="Año" type="number" value={anio} onChange={(e) => setAnio(e.target.value)} size="small" />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" onClick={onCreateCamion} disabled={!token || !canCreateCamion}>
                        Crear Camion
                      </Button>
                      <Button variant="outlined" onClick={onLoadCamiones} disabled={!token}>
                        Listar Camiones
                      </Button>
                    </Stack>

                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle1">Camiones</Typography>
                      {camiones.length === 0 ? (
                        <Typography variant="body2">Sin camiones cargados aun.</Typography>
                      ) : (
                        <Stack spacing={1}>
                          {camiones.map((camion) => (
                            <Box key={camion.id} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                              <Typography variant="body2">
                                #{camion.id} - {camion.patente} - {camion.marca} {camion.modelo} ({camion.anio})
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Paper>
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
